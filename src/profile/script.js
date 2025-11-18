// src/profile/script.js

document.addEventListener('DOMContentLoaded', () => {
    
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const sections = document.querySelectorAll('.view-section');

    // Get the dynamic elements to populate
    const sidebarNameEl = document.getElementById('sidebar-user-name');
    const settingNameInput = document.getElementById('setting-name');
    const settingEmailInput = document.getElementById('setting-email');
    const settingPhoneInput = document.getElementById('setting-phone');
    const settingPasswordInput = document.getElementById('setting-password'); // Used to set placeholder value

    // --- FETCH AND POPULATE USER DATA ---
    async function fetchAndPopulateUserData() {
        const userId = localStorage.getItem('userId');
        
        // 1. Check for session and redirect if not found
        if (!userId) {
            console.error("No user ID found in session. Redirecting to login.");
            // Prevent execution and redirect
            window.location.href = '../login/login.html'; 
            return;
        }
        
        // Set a loading state
        if (sidebarNameEl) sidebarNameEl.textContent = 'Loading...';

        try {
            // 2. Call the protected backend route, passing userId in the header
            const response = await fetch('http://localhost:3000/profile', {
                method: 'GET',
                headers: {
                    'X-User-Id': userId,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                // If token is rejected or user not found
                throw new Error('Failed to fetch user profile.');
            }

            const user = await response.json();

            // 3. Populate all profile fields from the fetched data
            const fullName = user.name;
            const phoneNumber = user.phone_number;
            
            if (sidebarNameEl) sidebarNameEl.textContent = fullName;

            if (settingNameInput) settingNameInput.value = fullName;
            if (settingEmailInput) settingEmailInput.value = user.email;
            if (settingPhoneInput) settingPhoneInput.value = phoneNumber;
            
            // Set password input to a non-value placeholder if it exists
            if (settingPasswordInput) {
                settingPasswordInput.value = '********';
            }

        } catch (error) {
            console.error('Error loading profile data:', error);
            if (sidebarNameEl) sidebarNameEl.textContent = 'Error';
            alert('Could not load user profile. Please try logging in again.');
            // On critical fetch failure, clear session and redirect
            localStorage.clear();
            window.location.href = '../login/login.html';
        }
    }

    // Call the function on DOMContentLoaded
    fetchAndPopulateUserData();


    // --- EXISTING: SIDEBAR NAVIGATION LOGIC ---
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // 1. Remove 'active' class from all sidebar links
            sidebarLinks.forEach(l => l.classList.remove('active'));
            
            // 2. Add 'active' class to clicked link
            link.classList.add('active');

            // 3. Hide all sections
            sections.forEach(sec => sec.style.display = 'none');

            // 4. Show target section
            const targetId = link.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.style.display = 'block';
            }
        });
    });

    // --- EXISTING: Toggle Password Visibility in Settings ---
    const togglePw = document.querySelector('.toggle-pw');
    if(togglePw) {
        togglePw.addEventListener('click', function() {
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