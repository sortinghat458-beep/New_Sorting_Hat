require('dotenv').config();

const express = require('express');

const cors = require('cors');const cors = require('cors');

const fetch = require('node-fetch');const fetch = require('node-fetch');



const app = express();const app = express();

const PORT = process.env.PORT || 8080;const PORT = process.env.PORT || 8080;



// Lark Base configuration// Lark Base configuration

const config = {const config = {

    appId: 'cli_a85633f4cbf9d028',    appId: 'cli_a85633f4cbf9d028',

    appSecret: 'DKHPXJ6uzdZncrIbiZYJsgijw8PKE2JW',    appSecret: 'DKHPXJ6uzdZncrIbiZYJsgijw8PKE2JW',

    appToken: 'V1VKbIAasakzuAsD4x0lObgKgQc',    appToken: 'V1VKbIAasakzuAsD4x0lObgKgQc',

    tableId: 'tblMhTzRqOPlesg3'    tableId: 'tblMhTzRqOPlesg3'

};};



// Configure CORS// Configure CORS

app.use(cors({app.use(cors({

    origin: '*', // Allow all origins in development    origin: '*', // Allow all origins in development

    methods: ['GET', 'POST'],    methods: ['GET', 'POST'],

    allowedHeaders: ['Content-Type', 'Authorization']    allowedHeaders: ['Content-Type', 'Authorization']

}));}));



// Parse JSON bodies// Parse JSON bodies

app.use(express.json());app.use(express.json());



// Serve static files// Serve static files

app.use(express.static('.'));app.use(express.static('.'));



// Get tenant access token// Get tenant access token

async function getTenantAccessToken() {async function getTenantAccessToken() {

    try {    try {

        const response = await fetch('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {        const response = await fetch('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {

            method: 'POST',            method: 'POST',

            headers: {            headers: {

                'Content-Type': 'application/json'                'Content-Type': 'application/json'

            },            },

            body: JSON.stringify({            body: JSON.stringify({

                'app_id': config.appId,                'app_id': config.appId,

                'app_secret': config.appSecret                'app_secret': config.appSecret

            })            })

        });        });



        const data = await response.json();        const data = await response.json();

        if (!data.tenant_access_token) {        if (!data.tenant_access_token) {

            throw new Error('Failed to get access token');            throw new Error('Failed to get access token');

        }        }



        return data.tenant_access_token;        return data.tenant_access_token;

    } catch (error) {    } catch (error) {

        console.error('Error getting tenant access token:', error);        console.error('Error getting tenant access token:', error);

        throw error;        throw error;

    }    }

}}



// API endpoint to check email// API endpoint to check email

app.get('/api/check-email', async (req, res) => {app.get('/api/check-email', async (req, res) => {

    const { email } = req.query;    const { email } = req.query;



    if (!email) {    if (!email) {

        return res.status(400).json({ error: 'Email is required' });        return res.status(400).json({ error: 'Email is required' });

    }    }



    try {    try {

        const token = await getTenantAccessToken();        const token = await getTenantAccessToken();

                

        const response = await fetch(        const response = await fetch(

            `https://open.larksuite.com/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records?filter=CurrentValue.[Email]="${email}"`,            `https://open.larksuite.com/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records?filter=CurrentValue.[Email]="${email}"`,

            {            {

                headers: {                headers: {

                    'Authorization': `Bearer ${token}`,                    'Authorization': `Bearer ${token}`,

                    'Content-Type': 'application/json'                    'Content-Type': 'application/json'

                }                }

            }            }

        );        );



        const data = await response.json();        const data = await response.json();

        console.log('Lark Base Raw Response:', JSON.stringify(data, null, 2));        console.log('Lark Base Raw Response:', JSON.stringify(data, null, 2));



        if (!data.data || !data.data.items || data.data.items.length === 0) {        if (!data.data || !data.data.items || data.data.items.length === 0) {

            return res.status(404).json({ error: 'Email not found in our records' });            return res.status(404).json({ error: 'Email not found in our records' });

        }        }



        const record = data.data.items[0];        const record = data.data.items[0];

        console.log('Found record:', JSON.stringify(record, null, 2));        console.log('Found record:', JSON.stringify(record, null, 2));



        if (!record.fields || !record.fields.Result) {        if (!record.fields || !record.fields.Result) {

            return res.status(404).json({ error: 'No result found for this email' });            return res.status(404).json({ error: 'No result found for this email' });

        }        }



        // Get the Result value and ensure it's a string        // Get the Result value and ensure it's a string

        let result = record.fields.Result;        let result = record.fields.Result;

                

        // If result is an array, get the first item's text value        // If result is an array, get the first item's text value

        if (Array.isArray(result)) {        if (Array.isArray(result)) {

            result = result[0]?.text || 'Unknown Result';            result = result[0]?.text || 'Unknown Result';

        } else if (typeof result === 'object' && result.text) {        } else if (typeof result === 'object' && result.text) {

            result = result.text;            result = result.text;

        }        }



        console.log('Processed Result:', result);        console.log('Processed Result:', result);

        res.json({ result });        res.json({ result });



    } catch (error) {    } catch (error) {

        console.error('Error checking email:', error);        console.error('Error checking email:', error);

        res.status(500).json({ error: 'Failed to check email: ' + error.message });        res.status(500).json({ error: 'Failed to check email: ' + error.message });

    }    }

});});



// Add a basic test route// Add a basic test route

app.get('/test', (req, res) => {app.get('/test', (req, res) => {

    res.json({ message: 'Server is working!' });    res.json({ message: 'Server is working!' });

});});



// Error handling middleware// Error handling middleware

app.use((err, req, res, next) => {app.use((err, req, res, next) => {

    console.error('Error:', err);    console.error('Error:', err);

    res.status(500).json({ error: 'Internal server error' });    res.status(500).json({ error: 'Internal server error' });

});});



const server = app.listen(PORT, '0.0.0.0', () => {const server = app.listen(PORT, '0.0.0.0', () => {

    console.log(`Server is running on http://localhost:${PORT}`);    console.log(`Server is running on http://localhost:${PORT}`);

    console.log('Press Ctrl+C to stop the server');    console.log('Press Ctrl+C to stop the server');

});});