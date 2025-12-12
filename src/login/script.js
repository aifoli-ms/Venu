document.addEventListener('DOMContentLoaded', () => {


    const togglePassword = document.getElementById('togglePassword');
    const messageEl = document.getElementById('message');


    if (togglePassword) {
        const passwordInput = document.getElementById('password');
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.classList.toggle('fa-eye-slash');
            togglePassword.classList.toggle('fa-eye');
        });
    }

    const loginForm = document.getElementById('signin-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            messageEl.textContent = '';
            messageEl.className = 'message';

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

                    if (data.user.role === 'owner' && data.user.owner_restaurant_id) {
                        window.location.href = `../restaurant/manage.html?id=${data.user.owner_restaurant_id}`;
                    } else if (data.user.role === 'owner') {
                        // Owner but no restaurant assigned yet? Maybe fallback or show alert
                        alert("Login successful, but no restaurant is linked to your account.");
                        // window.location.href = '../restaurant/create.html'; // Future feature?
                    } else {
                        window.location.href = '../dashboard/dashboard.html';
                    }
                } else {

                    const resultText = await response.text();
                    messageEl.textContent = resultText;
                    messageEl.className = 'message error';
                }

            } catch (error) {
                console.error(error);
                messageEl.textContent = 'Connection error';
                messageEl.className = 'message error';
            }
        });
    }


    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const phoneInput = document.getElementById('phone');
            const passwordInput = document.getElementById('password');
            const confirmPasswordInput = document.getElementById('confirm-password');

            if (passwordInput.value !== confirmPasswordInput.value) {
                alert("Passwords do not match!");
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: nameInput.value,
                        email: emailInput.value,
                        phone: phoneInput.value,
                        password: passwordInput.value
                    })
                });

                if (response.ok) {
                    alert("Account created! Please sign in.");
                    window.location.href = 'login.html';
                } else {
                    const data = await response.json();
                    alert(data.message || "Error creating account");
                }
            } catch (error) {
                console.error(error);
                alert("Connection error");
            }
        });
    }
});