document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('signin-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const messageEl = document.getElementById('message'); // The <p id="message"> tag

    // 1. Password Visibility Toggle (Your existing code)
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            togglePassword.classList.toggle('fa-eye-slash');
            togglePassword.classList.toggle('fa-eye');
        });
    }

    // 2. Form Submission (This replaces your placeholder 'alert')
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            // Prevent the default form submission
            event.preventDefault(); 

            // Clear any previous messages
            messageEl.textContent = '';
            messageEl.className = 'message';

            // Get form values
            const name = emailInput.value; // Sending email value as "name"
            const password = passwordInput.value;

            // Send data to your backend
            try {
                const response = await fetch('http://localhost:3000/users/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name: name, password: password }) 
                });

                const resultText = await response.text();

                // Display the server's response
                if (response.ok && resultText === "Success") { // e.g., Status 200 "Success"
                    // Redirect to dashboard on successful login
                    window.location.href = '../dashboard/dashboard.html';
                } else { // e.g., Status 401 "Not Allowed"
                    messageEl.textContent = resultText;
                    messageEl.className = 'message error';
                }

            } catch (error) {
                // This catches network errors (e.g., server is down)
                console.error('Error connecting to server:', error);
                messageEl.textContent = 'Connection error. Is the server running?';
                messageEl.className = 'message error';
            }
        });
    }
});