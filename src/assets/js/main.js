// This file contains the JavaScript code for client-side functionality, such as form validation and handling user interactions on the captive portal pages.

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('errorMessage');

    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        if (username === '' || password === '') {
            errorMessage.textContent = 'Please enter both username and password.';
            return;
        }

        // Simulate a login request
        fakeLoginRequest(username, password)
            .then(response => {
                if (response.success) {
                    window.location.href = 'success.html';
                } else {
                    errorMessage.textContent = response.message;
                }
            })
            .catch(error => {
                errorMessage.textContent = 'An error occurred. Please try again later.';
            });
    });

    function fakeLoginRequest(username, password) {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (username === 'user' && password === 'pass') {
                    resolve({ success: true });
                } else {
                    resolve({ success: false, message: 'Invalid credentials. Please try again.' });
                }
            }, 1000);
        });
    }
});