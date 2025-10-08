require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 8080;

// Lark Base configuration
const config = {
    appId: 'cli_a85633f4cbf9d028',
    appSecret: 'DKHPXJ6uzdZncrIbiZYJsgijw8PKE2JW',
    appToken: 'V1VKbIAasakzuAsD4x0lObgKgQc',
    tableId: 'tblMhTzRqOPlesg3'
};

// Configure CORS
app.use(cors({
    origin: '*', // Allow all origins in development
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static('.'));

// Get tenant access token
async function getTenantAccessToken() {
    try {
        const response = await fetch('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'app_id': config.appId,
                'app_secret': config.appSecret
            })
        });

        const data = await response.json();
        if (!data.tenant_access_token) {
            throw new Error('Failed to get access token');
        }

        return data.tenant_access_token;
    } catch (error) {
        console.error('Error getting tenant access token:', error);
        throw error;
    }
}

// API endpoint to check email
app.get('/api/check-email', async (req, res) => {
    const { email } = req.query;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const token = await getTenantAccessToken();
        
        const response = await fetch(
            `https://open.larksuite.com/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records?filter=CurrentValue.[Email]="${email}"`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const data = await response.json();
        console.log('Lark Base Raw Response:', JSON.stringify(data, null, 2));

        if (!data.data || !data.data.items || data.data.items.length === 0) {
            return res.status(404).json({ error: 'Email not found in our records' });
        }

        const record = data.data.items[0];
        console.log('Found record:', JSON.stringify(record, null, 2));

        if (!record.fields || !record.fields.Result) {
            return res.status(404).json({ error: 'No result found for this email' });
        }

        // Get the Result value and ensure it's a string
        let result = record.fields.Result;
        
        // If result is an array, get the first item's text value
        if (Array.isArray(result)) {
            result = result[0]?.text || 'Unknown Result';
        } else if (typeof result === 'object' && result.text) {
            result = result.text;
        }

        console.log('Processed Result:', result);
        res.json({ result });

    } catch (error) {
        console.error('Error checking email:', error);
        res.status(500).json({ error: 'Failed to check email: ' + error.message });
    }
});

// Add a basic test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop the server');
});