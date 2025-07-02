import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { LeagueAccount } from './database/index.js';

dotenv.config();

// Connect to database
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Manual decay processing function
async function processDecayManually() {
  try {
    console.log('🧪 Processing decay manually...\n');

    // Find all accounts that are diamond and above
    const diamondPlusAccounts = await LeagueAccount.find({
      tier: { $in: ['DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'] },
      isActive: true
    });

    console.log(`📊 Found ${diamondPlusAccounts.length} diamond+ accounts`);

    if (diamondPlusAccounts.length === 0) {
      console.log('ℹ️  No diamond+ accounts found to process decay');
      return;
    }

    const processedAccounts = [];
    const errors = [];

    // Process each account
    for (const account of diamondPlusAccounts) {
      try {
        console.log(`\n🔄 Processing: ${account.gameName}#${account.tagLine} (${account.tier}${account.division || ''})`);
        console.log(`   Current decay days: ${account.remainingDecayDays}`);

        // Only process if account has remaining decay days
        if (account.remainingDecayDays > 0) {
          const previousDecayDays = account.remainingDecayDays;
          account.remainingDecayDays -= 1;
          await account.save();
          
          console.log(`   ✅ Decay days: ${previousDecayDays} → ${account.remainingDecayDays}`);
          
          processedAccounts.push({
            id: account._id,
            riotId: `${account.gameName}#${account.tagLine}`,
            tier: account.tier,
            division: account.division,
            previousDecayDays: previousDecayDays,
            currentDecayDays: account.remainingDecayDays
          });
        } else {
          console.log(`   ⏭️  Skipped (no decay days remaining)`);
        }
      } catch (accountError) {
        console.error(`   ❌ Error processing account ${account._id}:`, accountError.message);
        errors.push({
          accountId: account._id,
          riotId: `${account.gameName}#${account.tagLine}`,
          error: accountError.message
        });
      }
    }

    console.log('\n📈 Summary:');
    console.log(`   Processed: ${processedAccounts.length} accounts`);
    console.log(`   Total found: ${diamondPlusAccounts.length} accounts`);
    console.log(`   Errors: ${errors.length}`);

    if (processedAccounts.length > 0) {
      console.log('\n📝 Successfully processed accounts:');
      processedAccounts.forEach((account, index) => {
        console.log(`   ${index + 1}. ${account.riotId} (${account.tier}${account.division || ''})`);
        console.log(`      Decay days: ${account.previousDecayDays} → ${account.currentDecayDays}`);
      });
    }

    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.riotId}: ${error.error}`);
      });
    }

  } catch (error) {
    console.error('❌ Manual decay processing failed:', error.message);
  }
}

// Run the test
async function runTest() {
  await connectDB();
  await processDecayManually();
  await mongoose.disconnect();
  console.log('\n✅ Test completed');
}

runTest(); 
