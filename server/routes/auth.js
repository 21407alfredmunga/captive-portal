const express = require('express');
const router = express.Router();
const { verifyAccessToken } = require('../utils/jwt');

// Mock user data for demonstration purposes
const users = [
    { username: 'user1', password: 'password1' },
    { username: 'user2', password: 'password2' }
];

// Login route
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        // Successful login
        res.status(200).json({ message: 'Login successful', user: username });
    } else {
        // Failed login
        res.status(401).json({ message: 'Invalid username or password' });
    }
});

// Check access status
router.get('/status', (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ valid: false, message: 'No token provided' });
        }
        
        const userData = verifyAccessToken(token);
        
        // Check if token is expired
        if (new Date(userData.expiresAt) < new Date()) {
            return res.status(403).json({ valid: false, message: 'Access expired' });
        }
        
        // Return access status
        res.json({
            valid: true,
            package: userData.package,
            purchasedAt: userData.purchasedAt,
            expiresAt: userData.expiresAt
        });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(403).json({ valid: false, message: 'Invalid token' });
    }
});

// Handle disconnect
router.post('/disconnect', (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }
        
        // Verify token before disconnecting
        verifyAccessToken(token);
        
        // In a real implementation, you would update firewall rules
        // to revoke network access for the user
        
        res.json({ success: true, message: 'Successfully disconnected' });
    } catch (error) {
        console.error('Disconnect error:', error);
        res.status(403).json({ success: false, message: 'Invalid token' });
    }
});

// Export the router
module.exports = router;