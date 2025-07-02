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

// Test isDecaying flag logic
async function testIsDecayingLogic() {
  try {
    console.log('🧪 Testing isDecaying flag logic...\n');

    // Find all accounts with 0 decay days
    const accountsWithZeroDecay = await LeagueAccount.find({
      remainingDecayDays: 0,
      isActive: true
    });

    console.log(`📊 Found ${accountsWithZeroDecay.length} accounts with 0 decay days`);

    if (accountsWithZeroDecay.length === 0) {
      console.log('ℹ️  No accounts with 0 decay days found');
      console.log('💡 You can create test accounts or reduce decay days manually to test this logic');
      return;
    }

    console.log('\n📝 Accounts that should have isDecaying flag set:');
    accountsWithZeroDecay.forEach((account, index) => {
      console.log(`  ${index + 1}. ${account.riotId} (${account.tier}${account.division || ''} ${account.lp}LP)`);
      console.log(`     Current isDecaying: ${account.isDecaying}`);
      console.log(`     Should be: true`);
    });

    // Set isDecaying flag for accounts with 0 decay days
    console.log('\n🔄 Setting isDecaying flag for accounts with 0 decay days...');
    const processedAccounts = [];

    for (const account of accountsWithZeroDecay) {
      try {
        if (!account.isDecaying) {
          account.isDecaying = true;
          await account.save();

          console.log(`✅ ${account.riotId}: Set isDecaying flag to true`);

          processedAccounts.push({
            id: account._id,
            riotId: account.riotId,
            tier: account.tier,
            division: account.division,
            isDecaying: true
          });
        } else {
          console.log(`ℹ️  ${account.riotId}: isDecaying flag already set`);
        }

      } catch (error) {
        console.error(`❌ Error processing ${account.riotId}:`, error.message);
      }
    }

    console.log(`\n📈 Summary: Set isDecaying flag for ${processedAccounts.length} accounts`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test regular decay (non-Master+ accounts)
async function testRegularDecay() {
  try {
    console.log('\n🧪 Testing regular decay logic...\n');

    // Find Diamond accounts with decay days > 0
    const diamondAccounts = await LeagueAccount.find({
      tier: 'DIAMOND',
      remainingDecayDays: { $gt: 0 },
      isActive: true
    });

    console.log(`📊 Found ${diamondAccounts.length} Diamond accounts with decay days > 0`);

    if (diamondAccounts.length === 0) {
      console.log('ℹ️  No Diamond accounts with decay days found');
      return;
    }

    console.log('\n📝 Diamond accounts that would lose 1 decay day:');
    diamondAccounts.forEach((account, index) => {
      console.log(`  ${index + 1}. ${account.riotId} (${account.tier} ${account.division} ${account.lp}LP)`);
      console.log(`     Decay days: ${account.remainingDecayDays} → ${account.remainingDecayDays - 1}`);
    });

    // Simulate regular decay
    console.log('\n🔄 Simulating regular decay...');
    const processedAccounts = [];

    for (const account of diamondAccounts) {
      try {
        const previousDecayDays = account.remainingDecayDays;
        account.remainingDecayDays -= 1;

        await account.save();

        console.log(`✅ ${account.riotId}: ${previousDecayDays} → ${account.remainingDecayDays} decay days`);

        processedAccounts.push({
          id: account._id,
          riotId: account.riotId,
          tier: account.tier,
          division: account.division,
          previousDecayDays: previousDecayDays,
          currentDecayDays: account.remainingDecayDays
        });

      } catch (error) {
        console.error(`❌ Error processing ${account.riotId}:`, error.message);
      }
    }

    console.log(`\n📈 Summary: Processed ${processedAccounts.length} accounts`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the tests
async function runTests() {
  await connectDB();
  await testIsDecayingLogic();
  await testRegularDecay();
  await mongoose.disconnect();
  console.log('\n✅ Tests completed');
}

runTests(); 
