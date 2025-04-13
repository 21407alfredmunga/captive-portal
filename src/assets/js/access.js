document.addEventListener('DOMContentLoaded', function() {
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
        // No access token, redirect to login
        window.location.href = 'login.html';
        return;
    }
    
    // Get access status from the server
    fetch('/api/access/status', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (!data.valid) {
            // Token is invalid or expired
            localStorage.removeItem('accessToken');
            window.location.href = 'login.html';
            return;
        }
        
        // Update UI with access information
        const packageNames = {
            'hourly': '1 Hour Access',
            'daily': '24 Hour Access',
            'weekly': '7 Day Access'
        };
        
        document.getElementById('package-type').textContent = packageNames[data.package] || data.package;
        document.getElementById('expiration-time').textContent = new Date(data.expiresAt).toLocaleString();
        
        // Set up time remaining counter
        updateTimeRemaining(data.expiresAt);
        setInterval(() => updateTimeRemaining(data.expiresAt), 1000);
    })
    .catch(error => {
        console.error('Error fetching access status:', error);
        window.location.href = 'login.html';
    });
    
    // Handle disconnect button
    document.getElementById('disconnect-btn').addEventListener('click', function() {
        const confirmDisconnect = confirm('Are you sure you want to disconnect? Your remaining time will be lost.');
        
        if (confirmDisconnect) {
            fetch('/api/access/disconnect', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            })
            .then(() => {
                localStorage.removeItem('accessToken');
                window.location.href = 'login.html';
            })
            .catch(error => {
                console.error('Error disconnecting:', error);
                alert('Failed to disconnect. Please try again.');
            });
        }
    });
    
    function updateTimeRemaining(expiresAt) {
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diff = expiry - now;
        
        if (diff <= 0) {
            // Access has expired
            document.getElementById('time-remaining').textContent = 'Expired';
            localStorage.removeItem('accessToken');
            alert('Your internet access has expired.');
            setTimeout(() => window.location.href = 'login.html', 1000);
            return;
        }
        
        // Calculate hours, minutes, seconds
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        let timeString = '';
        if (hours > 0) {
            timeString += `${hours}h `;
        }
        timeString += `${minutes}m ${seconds}s`;
        
        document.getElementById('time-remaining').textContent = timeString;
    }
});