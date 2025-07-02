import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'https://loldecay-backend.up.railway.app';
const API_KEY = process.env.DECAY_API_KEY;

// Function to check match history and update decay
async function checkMatchHistory() {
  try {
    console.log(`🕐 [${new Date().toISOString()}] Checking match history for all accounts...`);

    if (!API_KEY) {
      throw new Error('DECAY_API_KEY environment variable not set');
    }

    const response = await axios.post(`${API_BASE_URL}/api/accounts/decay/check-matches`, {}, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      }
    });

    const data = response.data;

    if (response.status === 200) {
      console.log(`✅ Match history check completed successfully!`);
      console.log(`📊 Processed ${data.data.processed} accounts out of ${data.data.totalFound} found`);
      
      if (data.data.accounts && data.data.accounts.length > 0) {
        console.log('\n📝 Updated Accounts:');
        data.data.accounts.forEach((account, index) => {
          console.log(`  ${index + 1}. ${account.riotId} (${account.tier}${account.division || ''})`);
          console.log(`     Games played: ${account.gamesPlayed}`);
          console.log(`     Decay days: ${account.previousDecayDays} → ${account.currentDecayDays} (+${account.decayDaysAdded})`);
        });
      } else {
        console.log('ℹ️  No accounts were updated (no new games found)');
      }
    } else {
      throw new Error(`API Error: ${data.error || 'Unknown error'}`);
    }

  } catch (error) {
    console.error(`❌ Match history check failed: ${error.message}`);
    // You might want to send an alert/notification here
  }
}

// Example usage:
// 1. Run once manually
// checkMatchHistory();

// 2. For cron job setup, export the function
export { checkMatchHistory };

// 3. Example cron job setup (uncomment and modify as needed):
/*
import cron from 'node-cron';

// Run every 30 minutes
cron.schedule('*/30 * * * *', () => {
  checkMatchHistory();
}, {
  scheduled: true,
  timezone: "America/New_York"
});

console.log('🕐 Cron job scheduled for match history checking every 30 minutes');
*/

// 4. For testing, you can run this directly
if (process.argv.includes('--run')) {
  checkMatchHistory();
} 
