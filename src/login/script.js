document.addEventListener('DOMContentLoaded', () => {
    
    // --- GLOBAL ELEMENTS ---
    const togglePassword = document.getElementById('togglePassword');
    const messageEl = document.getElementById('message');

    // 1. Password Visibility Toggle
    if (togglePassword) {
        const passwordInput = document.getElementById('password');
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePassword.classList.toggle('fa-eye-slash');
            togglePassword.classList.toggle('fa-eye');
        });
    }

    // --- LOGIN LOGIC (Only runs on login.html) ---
    const loginForm = document.getElementById('signin-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); 
            messageEl.textContent = '';
            messageEl.className = 'message';

            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');

            try {
                // Send ONLY email and password
                const response = await fetch('http://localhost:3000/users/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        email: emailInput.value, 
                        password: passwordInput.value 
                    }) 
                });

                const resultText = await response.text();

                if (response.ok && resultText === "Success") {
                    // Redirect to correct dashboard path
                    window.location.href = '../dashboard/dashboard.html';
                } else {
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

    // --- SIGNUP LOGIC (Only runs on signup.html) ---
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            // We define these inputs HERE, so they don't crash the Login page
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const phoneInput = document.getElementById('phone'); // Only exists on signup
            const passwordInput = document.getElementById('password');
            const confirmPasswordInput = document.getElementById('confirm-password');

            if (passwordInput.value !== confirmPasswordInput.value) {
                alert("Passwords do not match!");
                return;
            }

            try {
                // Send phone number during signup
                const response = await fetch('http://localhost:3000/users', {
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