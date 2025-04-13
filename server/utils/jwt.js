const jwt = require('jsonwebtoken');

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'captive-portal-secret-key';

// Generate access token
function generateAccessToken(userData) {
    return jwt.sign(userData, JWT_SECRET, {
        expiresIn: (new Date(userData.expiresAt) - new Date()) / 1000
    });
}

// Verify access token
function verifyAccessToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

module.exports = {
    generateAccessToken,
    verifyAccessToken
};