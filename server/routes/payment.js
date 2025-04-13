const express = require('express');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();
const { initiateMpesaSTK, checkMpesaStatus } = require('../utils/mpesa');
const { generateAccessToken } = require('../utils/jwt');

// Package configurations
const packages = {
    hourly: { price: 50, duration: 60 * 60 * 1000 }, // 1 hour in ms
    daily: { price: 100, duration: 24 * 60 * 60 * 1000 }, // 24 hours in ms
    weekly: { price: 500, duration: 7 * 24 * 60 * 60 * 1000 } // 7 days in ms
};

// Store pending transactions
const pendingTransactions = new Map();

// Request M-Pesa payment
router.post('/request', async (req, res) => {
    try {
        const { phoneNumber, package } = req.body;
        
        // Validate input
        if (!phoneNumber || !package) {
            return res.status(400).json({ 
                success: false, 
                message: 'Phone number and package are required' 
            });
        }
        
        // Validate package
        if (!packages[package]) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid package selected' 
            });
        }
        
        // Generate unique request ID
        const requestId = uuidv4();
        
        // Initialize transaction record
        pendingTransactions.set(requestId, {
            phoneNumber,
            package,
            amount: packages[package].price,
            status: 'PENDING',
            timestamp: new Date()
        });
        
        // Initiate M-Pesa STK push
        const stkResult = await initiateMpesaSTK(
            phoneNumber, 
            packages[package].price, 
            `WiFi ${package} access`
        );
        
        // Update transaction with checkout request ID
        if (stkResult.success) {
            const transaction = pendingTransactions.get(requestId);
            transaction.checkoutRequestId = stkResult.checkoutRequestId;
            pendingTransactions.set(requestId, transaction);
            
            return res.json({
                success: true,
                message: 'M-Pesa payment request sent',
                requestId: requestId
            });
        } else {
            // Handle STK push failure
            pendingTransactions.delete(requestId);
            
            return res.status(400).json({
                success: false,
                message: stkResult.message || 'Failed to initiate payment'
            });
        }
    } catch (error) {
        console.error('M-Pesa request error:', error);
        
        return res.status(500).json({
            success: false,
            message: 'Server error processing payment request'
        });
    }
});

// Check payment status
router.get('/status', async (req, res) => {
    try {
        const { requestId } = req.query;
        
        if (!requestId || !pendingTransactions.has(requestId)) {
            return res.status(404).json({ 
                success: false, 
                message: 'Invalid or expired payment request' 
            });
        }
        
        const transaction = pendingTransactions.get(requestId);
        
        // In development, simulate payment completion after 15 seconds
        if (process.env.NODE_ENV !== 'production' && 
            transaction.status === 'PENDING' && 
            (new Date() - transaction.timestamp > 15000)) {
            transaction.status = 'COMPLETED';
            pendingTransactions.set(requestId, transaction);
        }
        
        // For production, check the actual status with M-Pesa
        if (process.env.NODE_ENV === 'production' && 
            transaction.status === 'PENDING' && 
            transaction.checkoutRequestId) {
            const statusResult = await checkMpesaStatus(transaction.checkoutRequestId);
            
            if (statusResult.success) {
                transaction.status = 'COMPLETED';
                pendingTransactions.set(requestId, transaction);
            } else if (statusResult.failed) {
                transaction.status = 'FAILED';
                transaction.failureReason = statusResult.message;
                pendingTransactions.set(requestId, transaction);
            }
        }
        
        // Return appropriate response based on status
        if (transaction.status === 'COMPLETED') {
            // Generate access token
            const token = generateAccessToken({
                phoneNumber: transaction.phoneNumber,
                package: transaction.package,
                purchasedAt: new Date(),
                expiresAt: new Date(Date.now() + packages[transaction.package].duration)
            });
            
            return res.json({
                success: true,
                status: 'COMPLETED',
                message: 'Payment completed successfully',
                token: token
            });
        } else if (transaction.status === 'FAILED') {
            return res.json({
                success: false,
                status: 'FAILED',
                message: transaction.failureReason || 'Payment failed'
            });
        } else {
            return res.json({
                success: true,
                status: 'PENDING',
                message: 'Payment is being processed'
            });
        }
    } catch (error) {
        console.error('Payment status check error:', error);
        
        return res.status(500).json({
            success: false,
            message: 'Error checking payment status'
        });
    }
});

// M-Pesa callback endpoint
router.post('/callback', (req, res) => {
    try {
        const { Body } = req.body;
        
        if (!Body || !Body.stkCallback) {
            return res.status(400).json({ success: false });
        }
        
        const { ResultCode, CheckoutRequestID, ResultDesc } = Body.stkCallback;
        
        // Find transaction by CheckoutRequestID
        for (const [requestId, transaction] of pendingTransactions.entries()) {
            if (transaction.checkoutRequestId === CheckoutRequestID) {
                // Update transaction status based on result code
                if (ResultCode === 0) {
                    transaction.status = 'COMPLETED';
                } else {
                    transaction.status = 'FAILED';
                    transaction.failureReason = ResultDesc;
                }
                
                pendingTransactions.set(requestId, transaction);
                break;
            }
        }
        
        // Acknowledge callback
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('M-Pesa callback error:', error);
        res.status(500).json({ success: false });
    }
});

module.exports = router;