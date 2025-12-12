

document.addEventListener('DOMContentLoaded', () => {

    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const sections = document.querySelectorAll('.view-section');


    const sidebarNameEl = document.getElementById('sidebar-user-name');
    const settingNameInput = document.getElementById('setting-name');
    const settingEmailInput = document.getElementById('setting-email');
    const settingPhoneInput = document.getElementById('setting-phone');
    const settingPasswordInput = document.getElementById('setting-password');

    const reservationsListEl = document.getElementById('reservations-list');


    function formatReservationDate(dateString, timeString) {
        const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
        const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

        try {
            const date = new Date(`${dateString}T${timeString}`);
            return `${date.toLocaleDateString('en-US', dateOptions)} at ${date.toLocaleTimeString('en-US', timeOptions)}`;
        } catch {
            return 'Date/Time N/A';
        }
    }


    function createReservationCard(reservation) {
        const restaurant = reservation.restaurants;

        const status = reservation.status || 'Confirmed';
        const statusClass = status.toLowerCase().replace(/\s/g, '-');

        const formattedDateTime = formatReservationDate(
            reservation.reservation_date,
            reservation.reservation_time
        );


        const imageUrl = restaurant.image_url || 'https://via.placeholder.com/180';

        return `
            <div class="reservation-card" data-res-id="${reservation.id}">
                <div class="res-image">
                    <img src="${imageUrl}" alt="${restaurant.name}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div class="res-info">
                    <div class="res-header">
                        <h3>${restaurant.name}</h3>
                        <span class="res-status ${statusClass}">${status}</span>
                    </div>
                    <p class="res-sub">${restaurant.cuisine_type || 'Restaurant'}</p>
                    <p class="res-address"><i class="fas fa-map-marker-alt"></i> ${restaurant.location || 'N/A'}</p>
                    
                    <div class="res-footer">
                        <span class="res-date"><i class="fa-regular fa-calendar"></i> ${formattedDateTime}</span>
                        <span class="res-people"><i class="fa-solid fa-user-group"></i> ${reservation.party_size} people</span>
                        
                        ${status !== 'Cancelled' ? `<button class="btn-cancel" onclick="cancelReservation(${reservation.id})">Cancel Reservation</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // Expose function globally so onclick works
    // Modal Elements
    const confirmModal = document.getElementById('cancel-confirm-modal');
    const successModal = document.getElementById('cancel-success-modal');
    const confirmYesBtn = document.getElementById('cancel-yes');
    const confirmNoBtn = document.getElementById('cancel-no');
    const successCloseBtn = document.getElementById('success-close');

    let reservationToDelete = null;

    // Expose function globally so onclick works
    window.cancelReservation = (id) => {
        reservationToDelete = id;
        confirmModal.classList.remove('hidden');
    };

    if (confirmYesBtn) {
        confirmYesBtn.addEventListener('click', async () => {
            if (!reservationToDelete) return;

            // Show loading state if desired, or just proceed
            confirmYesBtn.textContent = "Cancelling...";
            confirmYesBtn.disabled = true;

            try {
                const response = await fetch(`${API_BASE_URL}/reservations/${reservationToDelete}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    }
                });

                if (response.ok) {
                    confirmModal.classList.add('hidden');
                    successModal.classList.remove('hidden');
                } else {
                    const err = await response.json();
                    alert("Error: " + err.message);
                    confirmModal.classList.add('hidden');
                }
            } catch (error) {
                console.error(error);
                alert("Failed to cancel.");
                confirmModal.classList.add('hidden');
            } finally {
                confirmYesBtn.textContent = "Yes, Cancel";
                confirmYesBtn.disabled = false;
                reservationToDelete = null;
            }
        });
    }

    if (confirmNoBtn) {
        confirmNoBtn.addEventListener('click', () => {
            confirmModal.classList.add('hidden');
            reservationToDelete = null;
        });
    }

    if (successCloseBtn) {
        successCloseBtn.addEventListener('click', () => {
            successModal.classList.add('hidden');
            window.location.reload();
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === confirmModal) {
            confirmModal.classList.add('hidden');
            reservationToDelete = null;
        }
        if (e.target === successModal) {
            successModal.classList.add('hidden');
            window.location.reload();
        }
    });


    async function fetchAndRenderReservations() {
        const userId = localStorage.getItem('userId');
        if (!userId || !reservationsListEl) return;

        reservationsListEl.innerHTML = '<p style="text-align: center;">Loading reservations...</p>';

        try {
            const response = await fetch(`${API_BASE_URL}/reservations/user`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch reservations.');
            }

            const reservations = await response.json();

            if (reservations.length === 0) {
                reservationsListEl.innerHTML = '<p style="text-align: center; color: var(--text-grey);">You have no past or upcoming reservations.</p>';
                return;
            }

            reservationsListEl.innerHTML = reservations.map(createReservationCard).join('');

        } catch (error) {
            console.error('Error loading reservations:', error);
            reservationsListEl.innerHTML = '<p style="text-align: center; color: var(--danger-red);">Failed to load reservations.</p>';
        }
    }


    async function fetchAndPopulateUserData() {
        const userId = localStorage.getItem('userId');

        if (!userId) {
            console.error("No user ID found in session. Redirecting to login.");
            window.location.href = '../login/login.html';
            return;
        }

        if (sidebarNameEl) sidebarNameEl.textContent = 'Loading...';

        try {
            const response = await fetch(`${API_BASE_URL}/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user profile.');
            }

            const user = await response.json();
            const fullName = user.name;
            const phoneNumber = user.phone_number;

            if (sidebarNameEl) sidebarNameEl.textContent = fullName;
            if (settingNameInput) settingNameInput.value = fullName;
            if (settingEmailInput) settingEmailInput.value = user.email;
            if (settingPhoneInput) settingPhoneInput.value = phoneNumber;
            if (settingPasswordInput) {
                settingPasswordInput.value = '********';
            }

        } catch (error) {
            console.error('Error loading profile data:', error);
            if (sidebarNameEl) sidebarNameEl.textContent = 'Error';
            alert('Could not load user profile. Please try logging in again.');
            localStorage.clear();
            window.location.href = '../login/login.html';
        }
    }


    fetchAndPopulateUserData();
    fetchAndRenderReservations();


    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            sections.forEach(sec => sec.style.display = 'none');

            const targetId = link.getAttribute('data-target');

            if (targetId === 'reservations') {
                fetchAndRenderReservations();
            }

            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.style.display = 'block';
            }
        });
    });

    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const userId = localStorage.getItem('userId');
            if (!userId) {
                alert("Session expired. Please log in again.");
                localStorage.clear();
                window.location.href = '../login/login.html';
                return;
            }

            const name = settingNameInput.value;
            const phone = settingPhoneInput.value;
            const newPassword = settingPasswordInput.value !== '********' ? settingPasswordInput.value : null;

            const updateData = { name: name, phone: phone };
            if (newPassword) { updateData.password = newPassword; }

            try {
                const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                    },
                    body: JSON.stringify(updateData)
                });

                if (response.ok) {
                    const result = await response.json();
                    alert("Profile updated successfully!");
                    localStorage.setItem('userName', result.user.name);
                    if (sidebarNameEl) sidebarNameEl.textContent = result.user.name;
                    fetchAndPopulateUserData();
                } else {
                    const errorData = await response.json();
                    alert(`Update failed: ${errorData.message}`);
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                alert("A network error occurred while saving changes.");
            }
        });
    }


    const togglePw = document.querySelector('.toggle-pw');
    if (togglePw) {
        togglePw.addEventListener('click', function () {
            const input = this.previousElementSibling;
            if (input.type === "password") {
                input.type = "text";
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            } else {
                input.type = "password";
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            }
        });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userId');
            localStorage.removeItem('userName');
            window.location.href = '../login/login.html';
        });
    }
});