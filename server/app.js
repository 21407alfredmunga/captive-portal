require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const authRoutes = require('./routes/auth');
const paymentRoutes = require('./routes/payment');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../src')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/mpesa', paymentRoutes);
app.use('/api/access', authRoutes);

// Default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../src/index.html'));
});

// Redirect to login page
app.get('/index.html', (req, res) => {
    res.redirect('/login.html');
});

// Start server
app.listen(PORT, () => {
    console.log(`Captive portal running on http://localhost:${PORT}`);
});