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
        
        // Build the URL with proper parameters for records
        const baseUrl = `https://open.larksuite.com/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records`;
        
        // Get all records for this email and include Date Created field
        const params = new URLSearchParams({
            filter: `CurrentValue.[Email]="${email}"`,
            field_names: JSON.stringify(["Email", "Result", "Date Created"])
        });
        
        console.log('Making request to Larkbase with params:', params.toString());
        
        const response = await fetch(
            `${baseUrl}?${params}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const data = await response.json();
        console.log('Lark Base Raw Response:', JSON.stringify(data, null, 2));

        // Check for API-level errors
        if (data.code !== 0) {
            console.error('Larkbase API Error:', data);
            return res.status(400).json({ 
                error: data.msg || 'Larkbase API error',
                details: data
            });
        }

        if (!data.data || !data.data.items || data.data.items.length === 0) {
            return res.status(404).json({ error: 'Email not found in our records' });
        }

        // Get all records and sort them by Date Created
        const records = data.data.items;
        
        // Sort records by Date Created field
        records.sort((a, b) => {
            // Parse the dates from the Date Created field
            const dateA = new Date(a.fields["Date Created"]);
            const dateB = new Date(b.fields["Date Created"]);
            // Sort in descending order (most recent first)
            return dateB - dateA;
        });

        console.log('All records for email sorted by date:', 
            records.map(r => ({
                date: r.fields["Date Created"],
                result: r.fields.Result
            }))
        );

        // Get the most recent record (first after sorting)
        const record = records[0];
        console.log('Most recent record:', {
            date: record.fields["Date Created"],
            result: record.fields.Result
        });

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