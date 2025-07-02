import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { LeagueAccount } from './database/index.js';
import { processAccountMatchHistory } from './services/riotApi.js';

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

// Test Diamond decay to Emerald
async function testDiamondToEmerald() {
  try {
    console.log('🧪 Testing Diamond decay to Emerald...\n');

    // Find or create a test account
    let testAccount = await LeagueAccount.findOne({
      isActive: true
    });

    if (!testAccount) {
      console.log('❌ No active accounts found to test with');
      return;
    }

    console.log(`📊 Using account: ${testAccount.riotId} for Diamond to Emerald test`);

    // Step 1: Set up Diamond account with decay days
    console.log('\n🔄 Step 1: Setting up Diamond account with decay days');
    testAccount.tier = 'DIAMOND';
    testAccount.division = 'IV';
    testAccount.lp = 50;
    testAccount.remainingDecayDays = 5;
    testAccount.isDecaying = false;
    testAccount.isSpecial = false;

    await testAccount.save();
    console.log(`✅ Initial state: ${testAccount.riotId} (${testAccount.tier} ${testAccount.division} ${testAccount.lp}LP)`);
    console.log(`   Decay days: ${testAccount.remainingDecayDays}, Is decaying: ${testAccount.isDecaying}`);

    // Step 2: Simulate rank update to Emerald - should set immunity
    console.log('\n🔄 Step 2: Simulating rank update to Emerald (should set immunity)');
    testAccount.tier = 'EMERALD';
    testAccount.division = 'I';
    testAccount.lp = 75;

    await testAccount.save();
    console.log(`✅ Set rank to: ${testAccount.tier} ${testAccount.division} ${testAccount.lp}LP`);

    // Process match history to trigger immunity check
    const matchResult = await processAccountMatchHistory(testAccount);
    console.log(`✅ Match history processing result: ${matchResult.updated ? 'Updated' : 'No changes'}`);

    // Reload account
    testAccount = await LeagueAccount.findById(testAccount._id);
    console.log(`   New state: Decay days: ${testAccount.remainingDecayDays}, Is decaying: ${testAccount.isDecaying}`);

    if (testAccount.remainingDecayDays === -1) {
      console.log(`   🛡️  SUCCESS: Diamond account decayed to Emerald and is now immune!`);
    } else {
      console.log(`   ❌ FAILED: Account should be immune but decay days = ${testAccount.remainingDecayDays}`);
    }

    console.log('\n✅ Diamond to Emerald test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test Emerald promotion to Diamond
async function testEmeraldToDiamond() {
  try {
    console.log('\n🧪 Testing Emerald promotion to Diamond...\n');

    // Find or create a test account
    let testAccount = await LeagueAccount.findOne({
      isActive: true
    });

    if (!testAccount) {
      console.log('❌ No active accounts found to test with');
      return;
    }

    console.log(`📊 Using account: ${testAccount.riotId} for Emerald to Diamond test`);

    // Step 1: Set up Emerald account with immunity
    console.log('\n🔄 Step 1: Setting up Emerald account with immunity');
    testAccount.tier = 'EMERALD';
    testAccount.division = 'I';
    testAccount.lp = 100;
    testAccount.remainingDecayDays = -1; // Immune
    testAccount.isDecaying = false;
    testAccount.isSpecial = false;

    await testAccount.save();
    console.log(`✅ Initial state: ${testAccount.riotId} (${testAccount.tier} ${testAccount.division} ${testAccount.lp}LP)`);
    console.log(`   Decay days: ${testAccount.remainingDecayDays} (IMMUNE), Is decaying: ${testAccount.isDecaying}`);

    // Step 2: Simulate rank update to Diamond - should reset to 28 days
    console.log('\n🔄 Step 2: Simulating rank update to Diamond (should reset to 28 days)');
    testAccount.tier = 'DIAMOND';
    testAccount.division = 'IV';
    testAccount.lp = 0;

    await testAccount.save();
    console.log(`✅ Set rank to: ${testAccount.tier} ${testAccount.division} ${testAccount.lp}LP`);

    // Process match history to trigger reset check
    const matchResult = await processAccountMatchHistory(testAccount);
    console.log(`✅ Match history processing result: ${matchResult.updated ? 'Updated' : 'No changes'}`);

    // Reload account
    testAccount = await LeagueAccount.findById(testAccount._id);
    console.log(`   New state: Decay days: ${testAccount.remainingDecayDays}, Is decaying: ${testAccount.isDecaying}`);

    if (testAccount.remainingDecayDays === 28) {
      console.log(`   🎯 SUCCESS: Emerald account promoted to Diamond and reset to 28 days!`);
    } else {
      console.log(`   ❌ FAILED: Account should be reset to 28 days but decay days = ${testAccount.remainingDecayDays}`);
    }

    console.log('\n✅ Emerald to Diamond test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test accounts that should be immune (Emerald)
async function testEmeraldAccounts() {
  try {
    console.log('\n🧪 Testing Emerald accounts...\n');

    // Find Emerald accounts
    const emeraldAccounts = await LeagueAccount.find({
      tier: 'EMERALD',
      isActive: true
    });

    console.log(`📊 Found ${emeraldAccounts.length} Emerald accounts`);

    if (emeraldAccounts.length === 0) {
      console.log('ℹ️  No Emerald accounts found');
      return;
    }

    console.log('\n📝 Emerald accounts:');
    emeraldAccounts.forEach((account, index) => {
      console.log(`  ${index + 1}. ${account.riotId} (${account.tier} ${account.division} ${account.lp}LP)`);
      console.log(`     Decay days: ${account.remainingDecayDays} ${account.remainingDecayDays === -1 ? '(IMMUNE)' : ''}`);
      console.log(`     Is decaying: ${account.isDecaying}`);
      console.log(`     Is special: ${account.isSpecial}`);
    });

    // Check if any Emerald accounts need immunity set
    const emeraldAccountsNeedingImmunity = emeraldAccounts.filter(account => account.remainingDecayDays !== -1);
    
    if (emeraldAccountsNeedingImmunity.length > 0) {
      console.log(`\n⚠️  Found ${emeraldAccountsNeedingImmunity.length} Emerald accounts that need immunity set:`);
      emeraldAccountsNeedingImmunity.forEach((account, index) => {
        console.log(`  ${index + 1}. ${account.riotId} - Decay days: ${account.remainingDecayDays}`);
      });
    } else {
      console.log('\n✅ All Emerald accounts are properly immune!');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test Diamond accounts that might need reset
async function testDiamondAccounts() {
  try {
    console.log('\n🧪 Testing Diamond accounts...\n');

    // Find Diamond accounts with -1 decay days (should be reset to 28)
    const diamondAccountsWithImmunity = await LeagueAccount.find({
      tier: 'DIAMOND',
      remainingDecayDays: -1,
      isActive: true
    });

    console.log(`📊 Found ${diamondAccountsWithImmunity.length} Diamond accounts with immunity (should be reset)`);

    if (diamondAccountsWithImmunity.length === 0) {
      console.log('ℹ️  No Diamond accounts with immunity found');
      return;
    }

    console.log('\n📝 Diamond accounts that need reset:');
    diamondAccountsWithImmunity.forEach((account, index) => {
      console.log(`  ${index + 1}. ${account.riotId} (${account.tier} ${account.division} ${account.lp}LP)`);
      console.log(`     Decay days: ${account.remainingDecayDays} (should be reset to 28)`);
      console.log(`     Is decaying: ${account.isDecaying}`);
      console.log(`     Is special: ${account.isSpecial}`);
    });

    // Process these accounts to trigger reset
    console.log('\n🔄 Processing Diamond accounts to trigger reset...');
    for (const account of diamondAccountsWithImmunity) {
      try {
        const result = await processAccountMatchHistory(account);
        console.log(`✅ ${account.riotId}: ${result.updated ? 'Updated' : 'No changes'}`);
      } catch (error) {
        console.error(`❌ Error processing ${account.riotId}:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the tests
async function runTests() {
  await connectDB();
  await testDiamondToEmerald();
  await testEmeraldToDiamond();
  await testEmeraldAccounts();
  await testDiamondAccounts();
  await mongoose.disconnect();
  console.log('\n✅ All tests completed');
}

runTests(); 
