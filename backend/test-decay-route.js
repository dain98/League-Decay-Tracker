import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'https://loldecay-backend.up.railway.app';

// Test the decay processing route
async function testDecayRoute() {
  try {
    console.log('🧪 Testing decay processing route...\n');

    // Get the API key for authentication
    const apiKey = process.env.DECAY_API_KEY;
    
    if (!apiKey) {
      console.log('❌ No API key provided. Set DECAY_API_KEY environment variable.');
      console.log('   This should be a secure key for automated decay processing.');
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/accounts/decay/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      }
    });

    const data = await response.json();

    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📋 Response Data:`, JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log('\n✅ Decay processing route test completed successfully!');
      
      if (data.data) {
        console.log(`📈 Processed ${data.data.processed} accounts out of ${data.data.totalFound} found`);
        
        if (data.data.accounts && data.data.accounts.length > 0) {
          console.log('\n📝 Processed Accounts:');
          data.data.accounts.forEach((account, index) => {
            console.log(`  ${index + 1}. ${account.riotId} (${account.tier}${account.division || ''})`);
            console.log(`     Decay days: ${account.previousDecayDays} → ${account.currentDecayDays}`);
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
      console.log('\n❌ Decay processing route test failed!');
      console.log(`Error: ${data.error || 'Unknown error'}`);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Test the route
testDecayRoute(); 
