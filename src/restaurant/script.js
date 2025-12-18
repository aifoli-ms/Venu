//This file is used to display the restaurant details
//It handles all the logic for the restaurant page
//It takes the information from the restaurant.html file and sends it to the API
//It also handles the display of the restaurant details and reservations
//It also handles the display of the restaurant menu


document.addEventListener('DOMContentLoaded', async () => {


    function getInitials(name) {
        if (!name) return 'SI';
        const parts = name.split(/\s+/).filter(part => part.length > 0);
        if (parts.length >= 2) {
            const firstInitial = parts[0].charAt(0).toUpperCase();
            const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
            return `${firstInitial}${lastInitial}`;
        } else if (parts.length === 1) {
            return parts[0].substring(0, 2).toUpperCase();
        }
        return 'SI';
    }

    function updateUserAvatar() {
        const userAvatarEl = document.getElementById('restaurant-avatar-initials');
        const userName = localStorage.getItem('userName');
        if (userAvatarEl) {
            const initials = getInitials(userName);
            userAvatarEl.textContent = initials;
            if (!userName) {
                userAvatarEl.href = '../login/login.html';
            } else {
                userAvatarEl.href = '../profile/profile.html';
            }
        }
    }

    updateUserAvatar();

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {

            localStorage.removeItem('authToken');
            localStorage.removeItem('userId');
            localStorage.removeItem('userName');
            window.location.href = '../login/login.html';
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const restaurantId = urlParams.get('id');
    const userId = localStorage.getItem('userId');

    if (!restaurantId) {
        alert("No restaurant specified.");
        window.location.href = '../dashboard/dashboard.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}`);
        if (!response.ok) throw new Error("Failed to fetch details");

        const data = await response.json();
        populatePage(data);
    } catch (error) {
        console.error(error);
        document.getElementById('res-name').textContent = "Error loading restaurant";
    }

    function populatePage(data) {
        document.getElementById('res-name').textContent = data.name;
        document.getElementById('res-cuisine').textContent = data.cuisine_type;
        document.getElementById('res-location').textContent = data.location || 'Unknown';
        document.getElementById('res-price').textContent = data.price_range || '₵₵';
        document.getElementById('res-total-reviews').textContent = `${data.total_reviews || 0} reviews`;

        document.getElementById('res-rating').textContent = data.average_rating || 'New';


        const statusEl = document.getElementById('res-status');
        statusEl.textContent = data.status || 'Open';
        if (data.status === 'Fully Booked') {
            statusEl.style.background = '#EF4444';
            statusEl.style.color = '#fff';
        }
    }


    const modal = document.getElementById('reservation-modal');
    const openBtn = document.getElementById('open-modal-btn');
    const closeBtn = document.querySelector('.close-modal');
    const form = document.getElementById('reservation-form');

    openBtn.addEventListener('click', () => {
        if (!userId) {
            showError("Please login to reserve.", "Login Required", () => {
                window.location.href = '../login/login.html';
            });
            return;
        }
        modal.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));


    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });


    const errorModal = document.getElementById('error-modal');
    const errorMsg = document.getElementById('error-msg');
    const errorTitle = document.getElementById('error-modal-title');
    const closeErrorBtn = document.querySelector('.close-error-modal');

    // Close Error Modal logic
    const closeErrorModal = () => {
        errorModal.classList.add('hidden');
        if (errorModal.onCloseAction) {
            errorModal.onCloseAction();
            errorModal.onCloseAction = null;
        }
    };

    if (closeErrorBtn) {
        closeErrorBtn.addEventListener('click', closeErrorModal);
    }
    window.addEventListener('click', (e) => {
        if (e.target === errorModal) {
            closeErrorModal();
        }
    });

    function showError(message, title = "Error", onClose = null) {
        if (errorMsg) errorMsg.textContent = message;
        if (errorTitle) errorTitle.textContent = title;
        if (errorModal) {
            errorModal.classList.remove('hidden');
            errorModal.onCloseAction = onClose;
        } else {
            alert(message); 
            if (onClose) onClose();
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const date = document.getElementById('modal-date').value;
        const time = document.getElementById('modal-time').value;
        const party = document.getElementById('modal-party').value;

        if (!date || !time) {
            showError("Please select date and time", "Missing Info");
            return;
        }


        const selectedDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); 

        const todayStr = new Date().toISOString().split('T')[0];

        if (date < todayStr) {
            showError("Cannot reserve a date in the past.", "Invalid Date");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/reservations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({
                    restaurant_id: restaurantId,
                    reservation_date: date,
                    reservation_time: time,
                    party_size: party
                })
            });

            if (response.ok) {
                modal.classList.add('hidden');
                document.getElementById('reservation-success-modal').classList.remove('hidden');
                form.reset();
            } else {
                const err = await response.json();
                showError(err.message || "Reservation failed.", "Reservation Error");
            }
        } catch (error) {
            console.error(error);
            showError("Connection failed", "Network Error");
        }
    });


    const reviewModal = document.getElementById('review-modal');
    const openReviewBtn = document.getElementById('open-review-modal-btn');
    const closeReviewBtn = document.querySelector('.close-review-modal');
    const reviewForm = document.getElementById('review-form');
    const reviewsList = document.getElementById('reviews-list');


    async function fetchReviews() {
        try {
            const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}/reviews`);
            if (!response.ok) throw new Error("Failed to fetch reviews");
            const reviews = await response.json();
            renderReviews(reviews);
        } catch (error) {
            console.error("Error loading reviews:", error);
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function renderReviews(reviews) {
        reviewsList.innerHTML = '';
        if (reviews.length === 0) {
            reviewsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-star"></i>
                    <p>No reviews yet.</p>
                </div>`;
            document.getElementById('review-rating').textContent = '--';
            return;
        }


        const totalRating = reviews.reduce((acc, r) => acc + r.rating, 0);
        const avgRating = (totalRating / reviews.length).toFixed(1);
        document.getElementById('review-rating').textContent = avgRating;
        document.getElementById('res-rating').textContent = avgRating;

        reviews.forEach(review => {
            const reviewEl = document.createElement('div');
            reviewEl.className = 'review-item';
            reviewEl.style.borderBottom = '1px solid #eee';
            reviewEl.style.padding = '1rem 0';


            const safeName = review.users ? review.users.name : 'Anonymous';
            const safeComment = review.comment;

            reviewEl.innerHTML = `
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <strong>${safeName}</strong>
                    <span style="color: #FFD700;"><i class="fas fa-star"></i> ${review.rating}</span>
                </div>
                <p style="color: #666; font-size: 0.9rem;">${safeComment}</p>
                <small style="color: #999;">${new Date(review.created_at).toLocaleDateString()}</small>
            `;
            reviewsList.appendChild(reviewEl);
        });
    }

    fetchReviews();


    const menusList = document.getElementById('menus-list');


    async function fetchMenus() {
        try {
            const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}/menus`);
            if (!response.ok) {
                const text = await response.text();
                console.error("Fetch failed:", response.status, text);
                throw new Error("Failed to fetch menus: " + response.status);
            }

            const clone = response.clone();
            try {
                const menus = await response.json();
                renderMenus(menus);
            } catch (jsonError) {
                const text = await clone.text();
                console.error("JSON Error:", jsonError, "Raw Body:", text);
            }
        } catch (error) {
            console.error("Error loading menus:", error);
        }
    }

    function renderMenus(menus) {
        if (!menusList) return;

        menusList.innerHTML = '';
        if (menus.length === 0) {
            menusList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-utensils"></i>
                    <p>No menus available.</p>
                </div>`;
            return;
        }

        menus.forEach(menu => {
            const menuEl = document.createElement('div');
            menuEl.className = 'menu-item';
            menuEl.innerHTML = `
                <h4>${menu.name}</h4>
                ${menu.description ? `<p>${menu.description}</p>` : ''}
            `;
            menuEl.addEventListener('click', () => openMenuModal(menu));
            menusList.appendChild(menuEl);
        });
    }

    fetchMenus();


    const menuModal = document.getElementById('menu-items-modal');
    const closeMenuModalBtn = document.querySelector('.close-menu-modal');
    const menuModalTitle = document.getElementById('menu-modal-title');
    const menuItemsList = document.getElementById('menu-items-list');

    async function openMenuModal(menu) {
        menuModalTitle.textContent = menu.name;
        menuItemsList.innerHTML = `
            <div class="empty-state">
                <p>Loading items...</p>
            </div>`;
        menuModal.classList.remove('hidden');

        try {
            const response = await fetch(`${API_BASE_URL}/menus/${menu.id}/items`);
            if (!response.ok) throw new Error("Failed to fetch menu items");
            const items = await response.json();
            renderMenuItems(items);
        } catch (error) {
            console.error("Error loading menu items:", error);
            menuItemsList.innerHTML = `
                <div class="empty-state">
                    <p>Error loading items.</p>
                </div>`;
        }
    }

    function renderMenuItems(items) {
        menuItemsList.innerHTML = '';
        if (items.length === 0) {
            menuItemsList.innerHTML = `
                <div class="empty-state">
                    <p>No items in this menu.</p>
                </div>`;
            return;
        }

        items.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'menu-item-row';

            const priceVal = item.price ? Number(item.price) : 0;

            itemEl.innerHTML = `
                <div class="menu-item-info">
                    <h4>${item.name}</h4>
                    ${item.description ? `<p>${item.description}</p>` : ''}
                </div>
                <div class="menu-item-price">
                    ₵${priceVal.toFixed(2)}
                </div>
            `;
            menuItemsList.appendChild(itemEl);
        });
    }

    if (closeMenuModalBtn) {
        closeMenuModalBtn.addEventListener('click', () => menuModal.classList.add('hidden'));
    }

    window.addEventListener('click', (e) => {
        if (e.target === menuModal) menuModal.classList.add('hidden');
    });



    openReviewBtn.addEventListener('click', () => {
        if (!userId) {
            showError("Please login to write a review.", "Login Required", () => {
                window.location.href = '../login/login.html';
            });
            return;
        }
        reviewModal.classList.remove('hidden');
    });

    closeReviewBtn.addEventListener('click', () => reviewModal.classList.add('hidden'));

    window.addEventListener('click', (e) => {
        if (e.target === reviewModal) reviewModal.classList.add('hidden');
    });


    reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const ratingEl = document.querySelector('input[name="rating"]:checked');
        const rating = ratingEl ? ratingEl.value : null;
        const comment = document.getElementById('review-comment').value;

        if (!rating) {
            showError("Please select a rating", "Rating Required");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/restaurants/${restaurantId}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                },
                body: JSON.stringify({ rating, comment })
            });

            if (response.ok) {

                reviewModal.classList.add('hidden');
                document.getElementById('review-success-modal').classList.remove('hidden');

                reviewForm.reset();
                fetchReviews();
            } else {
                const err = await response.json();
                showError(err.message, "Review Error");
            }
        } catch (error) {
            console.error(error);
            showError("Failed to submit review", "Submission Error");
        }
    });



    const successModal = document.getElementById('review-success-modal');
    const closeSuccessBtn = document.querySelector('.close-success-modal');

    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener('click', () => {
            successModal.classList.add('hidden');
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === successModal) {
            successModal.classList.add('hidden');
        }
    });


    const resSuccessModal = document.getElementById('reservation-success-modal');
    const closeResSuccessBtn = document.querySelector('.close-reservation-success-modal');

    if (closeResSuccessBtn) {
        closeResSuccessBtn.addEventListener('click', () => {
            resSuccessModal.classList.add('hidden');
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === resSuccessModal) {
            resSuccessModal.classList.add('hidden');
        }
    });
});