import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000';
const API_KEY = process.env.DECAY_API_KEY;

// Function to process decay
async function processDecay() {
  try {
    console.log(`🕐 [${new Date().toISOString()}] Processing daily decay...`);

    if (!API_KEY) {
      throw new Error('DECAY_API_KEY environment variable not set');
    }

    const response = await fetch(`${API_BASE_URL}/api/accounts/decay/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      }
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Decay processing completed successfully!`);
      console.log(`📊 Processed ${data.data.processed} accounts out of ${data.data.totalFound} found`);
      
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
// 1. Run once manually
// processDecay();

// 2. For cron job setup, export the function
export { processDecay };

// 3. Example cron job setup (uncomment and modify as needed):
/*
import cron from 'node-cron';

// Run every day at 2:00 AM
cron.schedule('0 2 * * *', () => {
  processDecay();
}, {
  scheduled: true,
  timezone: "America/New_York"
});

console.log('🕐 Cron job scheduled for daily decay processing at 2:00 AM EST');
*/

// 4. For testing, you can run this directly
if (process.argv.includes('--run')) {
  processDecay();
} 
