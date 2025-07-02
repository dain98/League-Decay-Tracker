import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.RAILWAY_PUBLIC_DOMAIN 
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` 
  : 'http://localhost:5000';

async function testAccountUpdate() {
    console.log('🧪 Testing Account Update...\n');
    console.log(`Using API URL: ${API_BASE_URL}\n`);

    try {
        // First, let's get a list of accounts to find one to update
        console.log('1️⃣ Getting accounts list...');
        const accountsResponse = await axios.get(`${API_BASE_URL}/api/accounts`, {
            headers: {
                'Authorization': `Bearer ${process.env.DECAY_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        const accounts = accountsResponse.data.data || [];
        console.log(`Found ${accounts.length} accounts`);
        
        if (accounts.length === 0) {
            console.log('❌ No accounts found to test with');
            return;
        }

        const testAccount = accounts[0];
        console.log(`Testing with account: ${testAccount.gameName}#${testAccount.tagLine}`);
        console.log(`Current decay days: ${testAccount.remainingDecayDays}`);
        console.log(`Current isSpecial: ${testAccount.isSpecial}`);
        console.log(`Current isDecaying: ${testAccount.isDecaying}`);
        console.log('');

        // Test update with new values
        const updateData = {
            gameName: testAccount.gameName,
            tagLine: testAccount.tagLine,
            region: testAccount.region,
            remainingDecayDays: 15, // Change to 15 days
            isSpecial: false,
            isDecaying: false
        };

        console.log('2️⃣ Testing account update...');
        console.log('Update data:', JSON.stringify(updateData, null, 2));
        
        const updateResponse = await axios.put(`${API_BASE_URL}/api/accounts/${testAccount._id}`, updateData, {
            headers: {
                'Authorization': `Bearer ${process.env.DECAY_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Update successful:', updateResponse.data.message);
        console.log('Updated account:', JSON.stringify(updateResponse.data.data, null, 2));

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);
        
        if (error.response?.data?.details) {
            console.log('Validation errors:', error.response.data.details);
        }
        
        if (error.response?.status === 401) {
            console.log('💡 Authentication error - check your API key');
        }
    }
}

// Run the test
testAccountUpdate(); 
