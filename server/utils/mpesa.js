const axios = require('axios');

// M-Pesa API credentials
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const SHORTCODE = process.env.MPESA_SHORTCODE;
const PASSKEY = process.env.MPESA_PASSKEY;
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL;

// M-Pesa API endpoints
const BASE_URL = process.env.MPESA_ENV === 'production' 
    ? 'https://api.safaricom.co.ke' 
    : 'https://sandbox.safaricom.co.ke';
    
const TOKEN_URL = `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`;
const STK_URL = `${BASE_URL}/mpesa/stkpush/v1/processrequest`;
const QUERY_URL = `${BASE_URL}/mpesa/stkpushquery/v1/query`;

// Get OAuth token
async function getAccessToken() {
    try {
        const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
        
        const response = await axios.get(TOKEN_URL, {
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });
        
        return response.data.access_token;
    } catch (error) {
        console.error('Error getting M-Pesa access token:', error);
        throw new Error('Failed to get M-Pesa access token');
    }
}

// Initiate STK Push
async function initiateMpesaSTK(phoneNumber, amount, description) {
    try {
        // Get access token
        const accessToken = await getAccessToken();
        
        // Format timestamp (YYYYMMDDHHmmss)
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        
        // Generate password
        const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');
        
        // Request payload
        const requestData = {
            BusinessShortCode: SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: amount,
            PartyA: phoneNumber,
            PartyB: SHORTCODE,
            PhoneNumber: phoneNumber,
            CallBackURL: CALLBACK_URL,
            AccountReference: 'CaptiveWiFi',
            TransactionDesc: description
        };
        
        // Make STK push request
        const response = await axios.post(STK_URL, requestData, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        // Check response
        if (response.data && response.data.ResponseCode === '0') {
            return {
                success: true,
                checkoutRequestId: response.data.CheckoutRequestID
            };
        } else {
            return {
                success: false,
                message: response.data.ResponseDescription || 'STK push failed'
            };
        }
    } catch (error) {
        console.error('M-Pesa STK push error:', error.response?.data || error.message);
        return {
            success: false,
            message: 'Failed to process payment request'
        };
    }
}

// Check STK Push status
async function checkMpesaStatus(checkoutRequestId) {
    try {
        // Get access token
        const accessToken = await getAccessToken();
        
        // Format timestamp
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        
        // Generate password
        const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');
        
        // Request payload
        const requestData = {
            BusinessShortCode: SHORTCODE,
            Password: password,
            Timestamp: timestamp,
            CheckoutRequestID: checkoutRequestId
        };
        
        // Query status
        const response = await axios.post(QUERY_URL, requestData, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        // Check response
        if (response.data.ResultCode === '0') {
            return {
                success: true,
                message: 'Payment completed successfully'
            };
        } else {
            return {
                failed: true,
                message: response.data.ResultDesc || 'Payment failed'
            };
        }
    } catch (error) {
        console.error('M-Pesa status check error:', error.response?.data || error.message);
        return {
            pending: true,
            message: 'Unable to determine payment status'
        };
    }
}

module.exports = {
    initiateMpesaSTK,
    checkMpesaStatus
};