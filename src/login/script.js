//This file is used to handle the login and signup process
//It handles all the logic for the login and signup pages
//It takes the information from the login.html file and sends it to the API
//It also handles the display of the login and signup pages
//It also handles the display of the popup messages




document.addEventListener('DOMContentLoaded', () => {


    const togglePassword = document.getElementById('togglePassword');


    if (togglePassword) {
        const passwordInput = document.getElementById('password');
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.classList.toggle('fa-eye-slash');
            togglePassword.classList.toggle('fa-eye');
        });
    }

    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    if (toggleConfirmPassword) {
        toggleConfirmPassword.addEventListener('click', function () {
            const confirmPasswordInput = document.getElementById('confirm-password');
            if (confirmPasswordInput) {
                const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                confirmPasswordInput.setAttribute('type', type);
                this.classList.toggle('fa-eye-slash');
                this.classList.toggle('fa-eye');
            }
        });
    }


    function showPopup(title, message, callback = null) {
        document.getElementById('popup-title').innerText = title;
        document.getElementById('popup-message').innerText = message;

        const popup = document.getElementById('popup-overlay');
        popup.style.display = 'flex';

        const closeBtn = document.getElementById('popup-close-btn');

        const newBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newBtn, closeBtn);

        newBtn.addEventListener('click', () => {
            popup.style.display = 'none';
            if (callback) {
                callback();
            }
        });
    }

    const loginForm = document.getElementById('signin-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();


            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');

            try {
                const response = await fetch(`${API_BASE_URL}/users/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: emailInput.value,
                        password: passwordInput.value
                    })
                });

                if (response.ok) {
                    const data = await response.json();

                    localStorage.setItem('userId', data.user.id);
                    localStorage.setItem('userName', data.user.name);
                    localStorage.setItem('userEmail', data.user.email);
                    localStorage.setItem('authToken', data.token);


                    localStorage.setItem('userRole', data.user.role || 'user');
                    if (data.user.owner_restaurant_id) {
                        localStorage.setItem('ownerRestaurantId', data.user.owner_restaurant_id);
                    }


                    if (data.user.role === 'admin') {
                        window.location.href = '../admin/index.html';
                    } else if (data.user.role === 'owner' && data.user.owner_restaurant_id) {
                        window.location.href = `../restaurant/manage.html?id=${data.user.owner_restaurant_id}`;
                    } else {
                        window.location.href = '../dashboard/dashboard.html';
                    }

                } else {
                    const data = await response.json();

                    showPopup("Login Failed", data.message || "Invalid credentials");
                }

            } catch (error) {
                console.error(error);
                showPopup("Error", "Connection error");
            }
        });
    }


    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();



            const user_password_input = document.getElementById('password');
            const confirm_user_password = document.getElementById('confirm-password');

            const actual_password_text = user_password_input.value;
            const repeat_password_text = confirm_user_password.value;


            if (actual_password_text !== repeat_password_text) {
                showPopup("Hold on!", "Passwords do not match!");
                return;
            }



            if (actual_password_text.length < 8) {
                showPopup("Password too short", "Password is too short... please make it at least 8 characters");
                return;
            }


            if (actual_password_text.length > 64) {
                showPopup("Password too long", "Wow that is a really long password! Maybe shorten it a bit? (under 64 chars)");
                return;
            }




            let password_points = 0;



            const has_big_letters = /[A-Z]/.test(actual_password_text);
            if (has_big_letters) {
                password_points = password_points + 1;
            }


            const has_small_letters = /[a-z]/.test(actual_password_text);
            if (has_small_letters) {
                password_points = password_points + 1;
            }


            const has_numbers = /[0-9]/.test(actual_password_text);
            if (has_numbers) {
                password_points = password_points + 1;
            }


            const has_weird_symbols = /[^A-Za-z0-9]/.test(actual_password_text);
            if (has_weird_symbols) {
                password_points = password_points + 1;
            }



            if (password_points < 3) {
                showPopup("Weak Password", "Your password needs to be a bit stronger. Try mixing letters, numbers, and symbols!");
                return;
            }

            try {
                const user_full_name = document.getElementById('name').value;
                const user_email_address = document.getElementById('email').value;
                const user_phone_number = document.getElementById('phone').value;


                const response = await fetch(`${API_BASE_URL}/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: user_full_name,
                        email: user_email_address,
                        phone: user_phone_number,
                        password: actual_password_text
                    })
                });

                if (response.ok) {
                    showPopup("Success!", "Account created! Please sign in.", () => {
                        window.location.href = 'login.html';
                    });
                } else {
                    const data = await response.json();
                    showPopup("Oops!", data.message || "Error creating account");
                }
            } catch (error) {
                console.error(error);
                showPopup("Error", "Connection error");
            }
        });
    }
});