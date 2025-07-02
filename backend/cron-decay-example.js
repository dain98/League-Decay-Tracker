import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const API_KEY = process.env.DECAY_API_KEY;

// Function to process decay
async function processDecay(region = null) {
  try {
    const regionMessage = region ? ` for region ${region}` : '';
    console.log(`🕐 [${new Date().toISOString()}] Processing daily decay${regionMessage}...`);

    if (!API_KEY) {
      throw new Error('DECAY_API_KEY environment variable not set');
    }

    // Prepare request body with optional region
    const requestBody = region ? { region } : {};

    const response = await axios.post(`${API_BASE_URL}/api/accounts/decay/process`, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      }
    });

    const data = response.data;

    if (response.status === 200) {
      console.log(`✅ Decay processing completed successfully!`);
      console.log(`📊 Processed ${data.data.processed} accounts out of ${data.data.totalFound} found for region: ${data.data.region}`);
      
      if (data.data.accounts && data.data.accounts.length > 0) {
        console.log('\n📝 Processed Accounts:');
        data.data.accounts.forEach((account, index) => {
          console.log(`  ${index + 1}. ${account.riotId} (${account.tier}${account.division || ''})`);
          console.log(`     Decay days: ${account.previousDecayDays} → ${account.currentDecayDays}`);
        });
      }
    } else {
      throw new Error(`API Error: ${data.error || 'Unknown error'}`);
    }

  } catch (error) {
    console.error(`❌ Decay processing failed: ${error.message}`);
    // You might want to send an alert/notification here
  }
}

// Example usage:
// 1. Run once manually for all regions
// processDecay();

// 2. Run once manually for specific region
// processDecay('NA1');  // North America
// processDecay('EUW1'); // Europe West
// processDecay('KR');   // Korea

// 3. For cron job setup, export the function
export { processDecay };

// 4. Example cron job setup for specific regions (uncomment and modify as needed):
/*
import cron from 'node-cron';

// Run every day at 2:00 AM EST for North America
cron.schedule('0 2 * * *', () => {
  processDecay('NA1');
}, {
  scheduled: true,
  timezone: "America/New_York"
});

// Run every day at 3:00 AM CET for Europe West
cron.schedule('0 3 * * *', () => {
  processDecay('EUW1');
}, {
  scheduled: true,
  timezone: "Europe/Paris"
});

// Run every day at 3:00 AM KST for Korea
cron.schedule('0 3 * * *', () => {
  processDecay('KR');
}, {
  scheduled: true,
  timezone: "Asia/Seoul"
});

console.log('🕐 Cron jobs scheduled for region-specific decay processing');
*/

// 5. For testing, you can run this directly
if (process.argv.includes('--run')) {
  // Test with all regions
  processDecay();
  
  // Or test with specific region
  // processDecay('NA1');
} 
