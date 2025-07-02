import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'https://loldecay-backend.up.railway.app';

// Test the match history checking route
async function testMatchHistoryRoute() {
  try {
    console.log('🧪 Testing match history checking route...\n');

    // Get the API key for authentication
    const apiKey = process.env.DECAY_API_KEY;
    
    if (!apiKey) {
      console.log('❌ No API key provided. Set DECAY_API_KEY environment variable.');
      console.log('   This should be a secure key for automated decay processing.');
      return;
    }

    const response = await axios.post(`${API_BASE_URL}/api/accounts/decay/check-matches`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      }
    });

    const data = response.data;

    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📋 Response Data:`, JSON.stringify(data, null, 2));

    if (response.status === 200) {
      console.log('\n✅ Match history checking route test completed successfully!');
      
      if (data.data) {
        console.log(`📈 Processed ${data.data.processed} accounts out of ${data.data.totalFound} found`);
        
        if (data.data.accounts && data.data.accounts.length > 0) {
          console.log('\n📝 Processed Accounts:');
          data.data.accounts.forEach((account, index) => {
            console.log(`  ${index + 1}. ${account.riotId} (${account.tier}${account.division || ''})`);
            console.log(`     Games played: ${account.gamesPlayed}`);
            console.log(`     Decay days: ${account.previousDecayDays} → ${account.currentDecayDays} (+${account.decayDaysAdded})`);
            console.log(`     Latest game ID: ${account.latestGameId}`);
          });
        }
        
        if (data.data.errors && data.data.errors.length > 0) {
          console.log('\n⚠️  Errors encountered:');
          data.data.errors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error.riotId}: ${error.error}`);
          });
        }
      }
    } else {
      console.log('\n❌ Match history checking route test failed!');
      console.log(`Error: ${data.error || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Test the route
testMatchHistoryRoute(); 
