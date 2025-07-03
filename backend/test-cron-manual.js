import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.RAILWAY_PUBLIC_DOMAIN 
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` 
  : 'http://localhost:5000';
const API_KEY = process.env.DECAY_API_KEY;

async function testCronJobs() {
    console.log('🧪 Testing Cron Jobs Manually...\n');
    console.log(`Using API URL: ${API_BASE_URL}\n`);

    try {
        // Test 1: Manual decay trigger
        console.log('1️⃣ Testing Manual Decay Processing...');
        const decayResponse = await axios.post(`${API_BASE_URL}/api/cron/trigger-decay`, {}, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Decay trigger successful:', decayResponse.data.message);
        console.log('');

        // Test 2: Manual match history trigger
        console.log('2️⃣ Testing Manual Match History Check...');
        const matchHistoryResponse = await axios.post(`${API_BASE_URL}/api/cron/trigger-match-history`, {}, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Match history trigger successful:', matchHistoryResponse.data.message);
        console.log('');

        // Test 4: Direct match history check
        console.log('4️⃣ Testing Direct Match History Check...');
        const directMatchResponse = await axios.post(`${API_BASE_URL}/api/accounts/decay/check-matches`, {}, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Direct match history check successful:', directMatchResponse.data.message);
        console.log('');

        console.log('🎉 All cron job tests passed!');
        console.log('');
        console.log('📋 Available Manual Triggers:');
        console.log(`   - POST ${API_BASE_URL}/api/cron/trigger-decay`);
        console.log(`   - POST ${API_BASE_URL}/api/cron/trigger-match-history`);
        console.log(`   - POST ${API_BASE_URL}/api/accounts/decay/process (with region)`);
        console.log(`   - POST ${API_BASE_URL}/api/accounts/decay/check-matches`);

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);
        
        if (error.response?.status === 503) {
            console.log('');
            console.log('💡 To enable cron jobs, set ENABLE_CRON=true in your environment variables');
        }
        
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            console.log('');
            console.log('🌐 Network error - check your API_BASE_URL and server status');
        }
    }
}

// Run the test
testCronJobs(); 
