import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const API_KEY = process.env.DECAY_API_KEY;

async function testCronSetup() {
    console.log('🧪 Testing Cron Job Setup...\n');

    try {
        // Test 1: Check if server is running
        console.log('1. Testing server health...');
        const healthResponse = await axios.get(`${API_BASE_URL}/api/health`);
        console.log('✅ Server is running:', healthResponse.data.status);
        console.log('');

        // Test 2: Test manual decay trigger
        console.log('2. Testing manual decay trigger...');
        const decayResponse = await axios.post(`${API_BASE_URL}/api/cron/trigger-decay`, {}, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Decay trigger successful:', decayResponse.data.message);
        console.log('');

        // Test 3: Test manual match history trigger
        console.log('3. Testing manual match history trigger...');
        const matchHistoryResponse = await axios.post(`${API_BASE_URL}/api/cron/trigger-match-history`, {}, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Match history trigger successful:', matchHistoryResponse.data.message);
        console.log('');

        console.log('🎉 All cron tests passed!');
        console.log('');
        console.log('📋 Cron Job Schedule:');
        console.log('   - Daily decay processing:');
        console.log('     * NA1: 00:00 America/Los_Angeles');
        console.log('     * KR: 00:00 Asia/Seoul');
        console.log('     * EUW1: 00:00 Europe/London');
        console.log('   - Match history checking: Every 30 minutes');
        console.log('');
        console.log('🔧 Manual triggers available at:');
        console.log(`   - POST ${API_BASE_URL}/api/cron/trigger-decay`);
        console.log(`   - POST ${API_BASE_URL}/api/cron/trigger-match-history`);

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data?.message || error.message);
        
        if (error.response?.status === 503) {
            console.log('');
            console.log('💡 To enable cron jobs, set ENABLE_CRON=true in your environment variables');
        }
    }
}

// Run the test
testCronSetup(); 
