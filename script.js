// Lark Base API configuration
const config = {
    appId: 'cli_a85633f4cbf9d028',
    appSecret: 'DKHPXJ6uzdZncrIbiZYJsgijw8PKE2JW',
    appToken: 'V1VKbIAasakzuAsD4x0lObgKgQc',
    tableId: 'tblMhTzRqOPlesg3',
    viewId: 'vewuuxuOFc'
};

// DOM Elements
const emailForm = document.getElementById('emailForm');
const emailInput = document.getElementById('emailInput');
const submitButton = document.getElementById('submitButton');
const resultDiv = document.getElementById('result');
const loadingDiv = document.getElementById('loading');

// Add event listener to form submission
emailForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    if (!email) {
        showResult('Please enter an email address', 'error');
        return;
    }

    try {
        showLoading(true);
        const result = await checkEmailAndGetResult(email);
        showResult(result, 'success');
    } catch (error) {
        showResult(error.message, 'error');
    } finally {
        showLoading(false);
    }
});

// Function to check email and get result from Lark Base
async function checkEmailAndGetResult(email) {
    // First, get access token
    const tokenResponse = await fetch('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'app_id': config.appId,
            'app_secret': config.appSecret
        })
    });

    const tokenData = await tokenResponse.json();
    if (!tokenData.tenant_access_token) {
        throw new Error('Failed to get access token');
    }

   // Get records from the table with Date Created field
    const response = await fetch(`https://open.larksuite.com/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records?view_id=${config.viewId}&field_names=["Email","Result","Date Created"]`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${tokenData.tenant_access_token}`,
            'Content-Type': 'application/json'
        }
    });

    const data = await response.json();
    if (!data.data || !data.data.items) {
        throw new Error('Failed to fetch data from Lark Base');
    }

    // Find all matching email records
    const matchingRecords = data.data.items.filter(item => 
        item.fields.Email && item.fields.Email.toLowerCase() === email.toLowerCase()
    );

    if (!matchingRecords.length) {
        throw new Error('Email not found in the database');
    }

    // Sort by Date Created (newest first)
    // matchingRecords.sort((a, b) => {
    //     const dateA = new Date(a.fields['Date Created']);
    //     const dateB = new Date(b.fields['Date Created']);
    //     return dateB - dateA;
    // });
    matchingRecords=matchingRecords.sort((a, b) => new Date(a.fields['Date Created']) - new Date(a.fields['Date Created']));
    console.log(matchingRecords);
    // Return the result of the newest record
    return matchingRecords[0].fields.Result || 'No result available';

}

// Helper function to show/hide loading state
function showLoading(show) {
    loadingDiv.style.display = show ? 'block' : 'none';
    submitButton.disabled = show;
}

// Helper function to show result message
function showResult(message, type) {
    resultDiv.textContent = message;
    resultDiv.className = 'result ' + type;
}