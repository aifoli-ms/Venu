document.addEventListener('DOMContentLoaded', async () => {

    const urlParams = new URLSearchParams(window.location.search);
    const restaurantId = urlParams.get('id');
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('authToken');

    if (!restaurantId || !userId || !token) {
        alert("Unauthorized access.");
        window.location.href = '../dashboard/dashboard.html';
        return;
    }

    const initials = localStorage.getItem('userName') ?
        localStorage.getItem('userName').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'SI';
    const avatar = document.getElementById('manager-avatar');
    if (avatar) avatar.textContent = initials;



    async function fetchDetails() {
        try {
            const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}`);
            if (!response.ok) throw new Error("Failed to load restaurant");
            const data = await response.json();

            document.getElementById('res-name').textContent = data.name;
            document.getElementById('res-location').textContent = data.location;


            const capacity = data.capacity || 50;
            document.getElementById('total-capacity').textContent = capacity;


            window.currentRestaurant = data;

            return capacity;
        } catch (e) {
            console.error(e);
            alert("Error loading restaurant details.");
        }
        return 50;
    }


    async function fetchReservations() {
        try {
            const response = await fetch(`${API_BASE_URL}/reservations/restaurant/${restaurantId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 403) {
                alert("Access Denied: You are not the owner of this restaurant.");
                window.location.href = '../dashboard/dashboard.html';
                return [];
            }

            if (!response.ok) throw new Error("Failed to load reservations");
            const reservations = await response.json();

            renderReservations(reservations);
            return reservations;
        } catch (e) {
            console.error(e);
            document.getElementById('reservations-body').innerHTML = `<tr><td colspan="4">Error loading reservations</td></tr>`;
        }
        return [];
    }

    function renderReservations(list) {
        const tbody = document.getElementById('reservations-body');
        tbody.innerHTML = '';

        if (list.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;">No upcoming reservations.</td></tr>`;
            return;
        }

        list.forEach(res => {
            const tr = document.createElement('tr');


            let statusClass = 'status-badge';
            if (res.status === 'Confirmed') statusClass += ' status-confirmed';

            const dateObj = new Date(res.reservation_date + 'T' + res.reservation_time);
            const formattedDate = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });


            let actionHtml = '';


            if (res.status === 'Confirmed') {
                actionHtml = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="${statusClass}">${res.status}</span>
                        <button class="btn btn-sm" style="padding: 4px 12px; font-size: 0.75rem; background: #EF4444; color: white; border: none; border-radius: 4px; cursor: pointer; transition: opacity 0.2s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1" onclick="closeReservation(${res.id})">
                            Close
                        </button>
                    </div>
                `;
            }

            else {

                let badgeStyle = 'background: #eee; color: #777;';
                if (res.status === 'Closed') badgeStyle = 'background: #fee2e2; color: #991b1b;';

                actionHtml = `<span class="status-badge" style="${badgeStyle}">${res.status}</span>`;
            }

            tr.innerHTML = `
                <td>
                    <div style="font-weight: bold;">${res.user_name || 'Guest'}</div>
                    <div style="font-size: 0.8rem; color: #888;">ID: #${res.id}</div>
                </td>
                <td>${formattedDate}</td>
                <td>${res.party_size} People</td>
                <td>
                    ${actionHtml}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }


    let reservationToClose = null;

    window.closeReservation = (reservationId) => {
        reservationToClose = reservationId;
        document.getElementById('confirmation-modal').style.display = 'flex';
    };

    window.closeModal = () => {
        document.getElementById('confirmation-modal').style.display = 'none';
        reservationToClose = null;
    };


    const confirmBtn = document.getElementById('confirm-close-btn');
    if (confirmBtn) {
        confirmBtn.onclick = async () => {
            if (!reservationToClose) return;

            const reservationId = reservationToClose;

            confirmBtn.disabled = true;
            confirmBtn.innerText = "Processing...";

            try {
                const response = await fetch(`${API_BASE_URL}/reservations/${reservationId}/status`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ status: 'Closed' })
                });

                if (response.ok) {
                    closeModal();
                    const allReservations = await fetchReservations();
                    updateSpacesLeft();
                } else {
                    const err = await response.json();
                    alert("Error: " + err.message);
                }
            } catch (e) {
                console.error(e);
                alert("Connection error");
            } finally {
                confirmBtn.disabled = false;
                confirmBtn.innerText = "Yes, Close It";
                closeModal();
            }
        };
    }


    window.openEditModal = () => {
        const data = window.currentRestaurant || {};

        document.getElementById('edit-name').value = data.name || '';
        document.getElementById('edit-location').value = data.location || '';
        document.getElementById('edit-capacity').value = data.capacity || '';
        document.getElementById('edit-cuisine').value = data.cuisine_type || '';
        document.getElementById('edit-description').value = data.description || '';

        document.getElementById('edit-modal').style.display = 'flex';
    };

    window.closeEditModal = () => {
        document.getElementById('edit-modal').style.display = 'none';
    };

    const editForm = document.getElementById('edit-restaurant-form');
    if (editForm) {
        editForm.onsubmit = async (e) => {
            e.preventDefault();
            const btn = document.getElementById('save-edit-btn');
            btn.disabled = true;
            btn.innerText = "Saving...";

            const updates = {
                name: document.getElementById('edit-name').value,
                location: document.getElementById('edit-location').value,
                capacity: document.getElementById('edit-capacity').value,
                cuisine_type: document.getElementById('edit-cuisine').value,
                description: document.getElementById('edit-description').value
            };

            try {
                const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(updates)
                });

                if (response.ok) {
                    alert("Restaurant details updated successfully!");
                    closeEditModal();
                    await fetchDetails();
                    updateSpacesLeft();
                } else {
                    const err = await response.json();
                    alert("Error: " + err.message);
                }
            } catch (err) {
                console.error(err);
                alert("Connection error");
            } finally {
                btn.disabled = false;
                btn.innerText = "Save Changes";
            }
        };
    }



    async function fetchReviews() {
        try {
            const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}/reviews`);
            const reviews = await response.json();

            const list = document.getElementById('reviews-list');
            list.innerHTML = '';

            if (reviews.length === 0) {
                list.innerHTML = '<p style="color:#999; text-align:center;">No reviews yet.</p>';
                return;
            }


            const total = reviews.reduce((acc, r) => acc + Number(r.rating), 0);
            const avg = (total / reviews.length).toFixed(1);
            document.getElementById('avg-rating').textContent = avg;

            reviews.forEach(r => {
                const item = document.createElement('div');
                item.className = 'review-card';
                item.innerHTML = `
                    <div style="display:flex; justify-content:space-between;">
                        <strong>${r.users.name || 'Anonymous'}</strong>
                        <span style="color:#FFD700;"><i class="fas fa-star"></i> ${r.rating}</span>
                    </div>
                    <p style="margin: 0.5rem 0; color:#555;">${r.comment}</p>
                    <small style="color:#999;">${new Date(r.created_at).toLocaleDateString()}</small>
                `;
                list.appendChild(item);
            });

        } catch (e) {
            console.error("Reviews error", e);
        }
    }



    const capacity = await fetchDetails();
    const allReservations = await fetchReservations();
    fetchReviews();

    window.updateSpacesLeft = () => {
        updateSpacesLeft();
    };

    function updateSpacesLeft() {
        const today = new Date().toISOString().split('T')[0];


        const list = window.currentReservations || [];

        const todayReservations = list.filter(r => r.reservation_date === today && r.status !== 'Cancelled' && r.status !== 'Closed');
        const booked = todayReservations.reduce((acc, r) => acc + Number(r.party_size), 0);

        let left = capacity - booked;
        if (left < 0) left = 0;

        document.getElementById('spaces-left').textContent = `${left} / ${capacity}`;


        const percentage = Math.min(100, (booked / capacity) * 100);
        document.getElementById('capacity-fill').style.width = `${percentage}%`;

        if (percentage > 90) {
            document.getElementById('capacity-fill').style.backgroundColor = '#EF4444';
        }
    }


    const originalRender = renderReservations;
    renderReservations = (list) => {
        window.currentReservations = list;
        originalRender(list);
    };

    updateSpacesLeft();

    // --- Menu Management Logic ---

    const manageMenusModal = document.getElementById('manage-menus-modal');
    const menuSelect = document.getElementById('manage-menu-select');
    const menuItemsBody = document.getElementById('manage-menu-items-body');
    const addItemForm = document.getElementById('add-menu-item-form');

    window.openManageMenusModal = async () => {
        manageMenusModal.style.display = 'flex';
        await loadMenusForManager();
    };

    window.closeManageMenusModal = () => {
        manageMenusModal.style.display = 'none';
        menuSelect.innerHTML = '<option value="">Loading...</option>';
        menuItemsBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #999;">Select a menu to view items</td></tr>';
    };

    async function loadMenusForManager() {
        try {
            const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}/menus`);
            if (!response.ok) throw new Error("Failed to fetch menus");
            const menus = await response.json();

            menuSelect.innerHTML = '<option value="">-- Select a Menu --</option>';
            menus.forEach(menu => {
                const opt = document.createElement('option');
                opt.value = menu.id;
                opt.textContent = menu.name;
                menuSelect.appendChild(opt);
            });
        } catch (error) {
            console.error(error);
            alert("Error loading menus");
        }
    }

    window.loadMenuItems = async () => {
        const menuId = menuSelect.value;
        if (!menuId) {
            menuItemsBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #999;">Select a menu to view items</td></tr>';
            return;
        }

        menuItemsBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #999;">Loading items...</td></tr>';

        try {
            const response = await fetch(`${API_BASE_URL}/menus/${menuId}/items`);
            if (!response.ok) throw new Error("Failed to fetch items");
            const items = await response.json();
            renderManagerMenuItems(items);
        } catch (error) {
            console.error(error);
            menuItemsBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: red;">Error loading items</td></tr>';
        }
    };

    function renderManagerMenuItems(items) {
        menuItemsBody.innerHTML = '';
        if (items.length === 0) {
            menuItemsBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: #999;">No items in this menu.</td></tr>';
            return;
        }

        items.forEach(item => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #eee';

            tr.innerHTML = `
                <td style="padding: 0.75rem 0;">
                    <div style="font-weight: bold;">${item.name}</div>
                    <div style="font-size: 0.85rem; color: #666;">${item.description || ''}</div>
                </td>
                <td style="padding: 0.75rem 0;">₵${Number(item.price).toFixed(2)}</td>
                <td style="padding: 0.75rem 0;">
                    <button class="btn btn-sm" onclick="deleteMenuItem(${item.id})" style="background: #fee2e2; color: #991b1b; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            menuItemsBody.appendChild(tr);
        });
    }

    if (addItemForm) {
        addItemForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const menuId = menuSelect.value;
            if (!menuId) {
                alert("Please select a menu first.");
                return;
            }

            const name = document.getElementById('new-item-name').value;
            const price = document.getElementById('new-item-price').value;
            const desc = document.getElementById('new-item-desc').value;

            const btn = addItemForm.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = "Adding...";

            try {
                const response = await fetch(`${API_BASE_URL}/menus/${menuId}/items`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        name: name,
                        price: price,
                        description: desc,
                        // Defaults
                        is_vegetarian: 0,
                        is_spicy: 0
                    })
                });

                if (response.ok) {
                    // Refresh Item List
                    addItemForm.reset();
                    await loadMenuItems();
                } else {
                    const err = await response.json();
                    alert("Error: " + err.message);
                }
            } catch (error) {
                console.error(error);
                alert("Connection failed");
            } finally {
                btn.disabled = false;
                btn.textContent = "Add Item";
            }
        });
    }

    window.deleteMenuItem = async (itemId) => {
        if (!confirm("Are you sure you want to remove this item?")) return;
        const menuId = menuSelect.value; // Get current menu context

        try {
            const response = await fetch(`${API_BASE_URL}/menus/${menuId}/items/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                await loadMenuItems();
            } else {
                alert("Failed to delete item.");
            }
        } catch (error) {
            console.error(error);
            alert("Connection error");
        }
    };

});
