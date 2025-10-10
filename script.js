// Lark Base API configuration
const config = {
    appId: 'cli_a85633f4cbf9d028',
    appSecret: 'DKHPXJ6uzdZncrIbiZYJsgijw8PKE2JW',
    appToken: 'V1VKbIAasakzuAsD4x0lObgKgQc',
    tableId: 'tblMhTzRqOPlesg3',
    viewId: 'vewuuxuOFc'
};

// House themes for styling
const houseThemes = {
    "GriffinHour": { class: "gryffindor" },
    "RavenClause": { class: "ravenclaw" },
    "SlytheRoll": { class: "slytherin" },
    "HuffleStaff": { class: "hufflepuff" }
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

    // Get records from the table
    const response = await fetch(`https://open.larksuite.com/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records`, {
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

    // Find matching email and return result
    const matchingRecord = data.data.items.find(item => 
        item.fields.Email && item.fields.Email.toLowerCase() === email.toLowerCase()
    );

    if (!matchingRecord) {
        throw new Error('Email not found in the database');
    }

    return matchingRecord.fields.Result || 'No result available';
}

// Helper function to show/hide loading state
function showLoading(show) {
    loadingDiv.style.display = show ? 'block' : 'none';
    submitButton.disabled = show;
}

// Helper function to show result message
function showResult(result, type = 'success') {
    console.log('Showing result:', result);
    const modalContent = resultDiv.querySelector('.modal-content');
    
    if (type === 'error') {
        modalContent.innerHTML = `<div class="title">${result}</div>`;
        modalContent.className = 'modal-content';
        resultDiv.style.display = 'flex';
        return;
    }

    // Handle array of text objects from Lark Base
    let resultArray = [];
    if (Array.isArray(result)) {
        resultArray = result;
    } else if (typeof result === 'object' && result.text) {
        resultArray = [result];
    } else if (typeof result === 'string') {
        try {
            resultArray = JSON.parse(result);
        } catch {
            resultArray = [{ text: result, type: 'text' }];
        }
    }

    // Extract house name and determine theme class
    const houseName = resultArray[0]?.text || '';
    const house = Object.keys(houseThemes).find(h => houseName.includes(h)) || "Unknown";
    const themeClass = houseThemes[house]?.class || '';

    // Format the message parts exactly as they come from Lark Base
    const mainMessage = resultArray[1]?.text || '';
    const motto = resultArray[2]?.text || '';
    const spacer = resultArray[3]?.text || '';
    const callToAction = resultArray[4]?.text || '';

    modalContent.innerHTML = `
        <div class="title">${houseName}</div>
        <div class="desc">${mainMessage}</div>
        <p class="motto">${motto}</p>
        ${spacer && `<br>`}
        <p class="cta">${callToAction}</p>
    `;
    
    modalContent.className = `modal-content ${themeClass}`;
    resultDiv.style.display = 'flex';
}