document.addEventListener('DOMContentLoaded', function() {
    const accessForm = document.getElementById('access-form');
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    const loading = document.getElementById('loading');
    const mpesaConfirm = document.getElementById('mpesa-confirm');
    const checkPaymentBtn = document.getElementById('check-payment');
    
    let paymentRequestId = null;
    let checkStatusInterval = null;

    accessForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Reset UI
        loading.classList.remove('hidden');
        errorMessage.classList.add('hidden');
        successMessage.classList.add('hidden');
        
        // Get selected package
        const selectedPackage = document.querySelector('input[name="package"]:checked').value;
        
        // Get phone number
        const phoneNumber = document.getElementById('phone-number').value;
        
        if (!validatePhoneNumber(phoneNumber)) {
            loading.classList.add('hidden');
            errorMessage.textContent = 'Please enter a valid M-Pesa phone number';
            errorMessage.classList.remove('hidden');
            return;
        }
        
        // Process M-Pesa payment request
        fetch('/api/mpesa/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phoneNumber: formatPhoneNumber(phoneNumber),
                package: selectedPackage
            }),
        })
        .then(response => response.json())
        .then(data => {
            loading.classList.add('hidden');
            
            if (data.success) {
                paymentRequestId = data.requestId;
                
                // Show success message with instructions
                successMessage.textContent = 'M-Pesa payment request sent to your phone';
                successMessage.classList.remove('hidden');
                
                // Show confirmation section
                mpesaConfirm.classList.remove('hidden');
                
                // Hide the form
                accessForm.classList.add('hidden');
                
                // Auto-check payment status every 5 seconds
                checkStatusInterval = setInterval(() => {
                    checkPaymentStatus(paymentRequestId);
                }, 5000);
            } else {
                // Show error message
                errorMessage.textContent = data.message || 'Failed to initiate M-Pesa payment';
                errorMessage.classList.remove('hidden');
            }
        })
        .catch(error => {
            loading.classList.add('hidden');
            errorMessage.textContent = 'An error occurred. Please try again.';
            errorMessage.classList.remove('hidden');
            console.error('Error:', error);
        });
    });
    
    // Handle "I've Completed the Payment" button
    checkPaymentBtn.addEventListener('click', function() {
        if (!paymentRequestId) {
            errorMessage.textContent = 'Payment session expired. Please try again.';
            errorMessage.classList.remove('hidden');
            return;
        }
        
        loading.classList.remove('hidden');
        errorMessage.classList.add('hidden');
        successMessage.classList.add('hidden');
        
        // Check payment status
        checkPaymentStatus(paymentRequestId);
    });
    
    // Function to check payment status
    function checkPaymentStatus(requestId) {
        fetch(`/api/mpesa/status?requestId=${requestId}`)
            .then(response => response.json())
            .then(data => {
                loading.classList.add('hidden');
                
                if (data.success && data.status === 'COMPLETED') {
                    // Clear the interval if it's set
                    if (checkStatusInterval) {
                        clearInterval(checkStatusInterval);
                    }
                    
                    // Store access token
                    localStorage.setItem('accessToken', data.token);
                    
                    // Redirect to success page
                    window.location.href = 'access-granted.html';
                } else if (data.status === 'PENDING') {
                    // No need to show a message, keep waiting
                } else {
                    errorMessage.textContent = data.message || 'Payment verification failed';
                    errorMessage.classList.remove('hidden');
                    
                    // Clear the interval if payment failed
                    if (checkStatusInterval) {
                        clearInterval(checkStatusInterval);
                    }
                }
            })
            .catch(error => {
                loading.classList.add('hidden');
                errorMessage.textContent = 'Error checking payment status';
                errorMessage.classList.remove('hidden');
                console.error('Error:', error);
            });
    }
    
    // Validate phone number format
    function validatePhoneNumber(phoneNumber) {
        // Accept formats: 07XXXXXXXX, 01XXXXXXXX, 254XXXXXXXXX
        const regex = /^(07|01)\d{8}$|^254\d{9}$/;
        return regex.test(phoneNumber);
    }
    
    // Format phone number to international format (254XXXXXXXXX)
    function formatPhoneNumber(phoneNumber) {
        if (phoneNumber.startsWith('0')) {
            return '254' + phoneNumber.slice(1);
        }
        return phoneNumber;
    }
});