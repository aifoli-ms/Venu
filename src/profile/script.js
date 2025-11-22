// src/profile/script.js

document.addEventListener('DOMContentLoaded', () => {

    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const sections = document.querySelectorAll('.view-section');

    // Get the dynamic elements to populate (user settings)
    const sidebarNameEl = document.getElementById('sidebar-user-name');
    const settingNameInput = document.getElementById('setting-name');
    const settingEmailInput = document.getElementById('setting-email');
    const settingPhoneInput = document.getElementById('setting-phone');
    const settingPasswordInput = document.getElementById('setting-password');

    // NEW: Get reservation container
    const reservationsListEl = document.getElementById('reservations-list');

    // --- UTILITY FUNCTION: DATE FORMATTING ---
    function formatReservationDate(dateString, timeString) {
        const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
        const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

        try {
            // Combine date and time to create a valid Date object
            const date = new Date(`${dateString}T${timeString}`);
            return `${date.toLocaleDateString('en-US', dateOptions)} at ${date.toLocaleTimeString('en-US', timeOptions)}`;
        } catch {
            return 'Date/Time N/A';
        }
    }

    // --- UTILITY FUNCTION: CARD GENERATION ---
    function createReservationCard(reservation) {
        const restaurant = reservation.restaurants;
        // Use a default status if none is provided
        const status = reservation.status || 'Confirmed';
        const statusClass = status.toLowerCase().replace(/\s/g, '-');

        const formattedDateTime = formatReservationDate(
            reservation.reservation_date,
            reservation.reservation_time
        );

        // NOTE: Uses a simple placeholder image if the DB image is missing
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
                    </div>
                </div>
            </div>
        `;
    }

    // --- NEW: FETCH AND RENDER RESERVATIONS ---
    async function fetchAndRenderReservations() {
        const userId = localStorage.getItem('userId');
        if (!userId || !reservationsListEl) return;

        reservationsListEl.innerHTML = '<p style="text-align: center;">Loading reservations...</p>';

        try {
            const response = await fetch('/reservations/user', {
                method: 'GET',
                headers: {
                    'X-User-Id': userId,
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


    // --- EXISTING: FETCH AND POPULATE USER DATA (for settings/sidebar) ---
    async function fetchAndPopulateUserData() {
        // ... (existing implementation remains the same) ...
        const userId = localStorage.getItem('userId');

        if (!userId) {
            console.error("No user ID found in session. Redirecting to login.");
            window.location.href = '../login/login.html';
            return;
        }

        if (sidebarNameEl) sidebarNameEl.textContent = 'Loading...';

        try {
            const response = await fetch('/profile', {
                method: 'GET',
                headers: {
                    'X-User-Id': userId,
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

    // Call on page load
    fetchAndPopulateUserData();
    fetchAndRenderReservations(); // Load reservations as it's the default tab


    // --- EXISTING: SIDEBAR NAVIGATION LOGIC ---
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            sections.forEach(sec => sec.style.display = 'none');

            const targetId = link.getAttribute('data-target');

            // Re-fetch when clicking the reservations link
            if (targetId === 'reservations') {
                fetchAndRenderReservations();
            }

            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.style.display = 'block';
            }
        });
    });

    // --- EXISTING: SAVE SETTINGS LOGIC ---
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', async (e) => {
            // ... (existing save changes logic) ...
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
                const response = await fetch(`/users/${userId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
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

    // --- EXISTING: Toggle Password Visibility in Settings ---
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
});