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

// Test the complete special immunity flow
async function testSpecialImmunityFlow() {
  try {
    console.log('🧪 Testing special immunity flow...\n');

    // Find or create a test account
    let testAccount = await LeagueAccount.findOne({
      isActive: true
    });

    if (!testAccount) {
      console.log('❌ No active accounts found to test with');
      return;
    }

    console.log(`📊 Using account: ${testAccount.riotId} for special immunity test`);

    // Step 1: Set up initial state - Master with LP < 75, 0 decay days, isDecaying=true
    console.log('\n🔄 Step 1: Setting up Master account with LP < 75, 0 decay days, isDecaying=true');
    testAccount.tier = 'MASTER';
    testAccount.lp = 50;
    testAccount.remainingDecayDays = 0;
    testAccount.isDecaying = true;
    testAccount.isSpecial = false;

    await testAccount.save();
    console.log(`✅ Initial state: ${testAccount.riotId} (${testAccount.tier} ${testAccount.lp}LP)`);
    console.log(`   Decay days: ${testAccount.remainingDecayDays}, Is decaying: ${testAccount.isDecaying}, Is special: ${testAccount.isSpecial}`);

    // Step 2: Simulate decay processing - should reset to 28 days and set isSpecial=true
    console.log('\n🔄 Step 2: Simulating decay processing (should reset to 28 days)');
    const decayResult = await simulateDecayProcessing(testAccount);
    console.log(`✅ Decay processing result: ${decayResult.message}`);

    // Reload account
    testAccount = await LeagueAccount.findById(testAccount._id);
    console.log(`   New state: Decay days: ${testAccount.remainingDecayDays}, Is decaying: ${testAccount.isDecaying}, Is special: ${testAccount.isSpecial}`);

    // Step 3: Simulate rank update to D2 75LP - should set immunity
    console.log('\n🔄 Step 3: Simulating rank update to D2 75LP (should set immunity)');
    testAccount.tier = 'DIAMOND';
    testAccount.division = 'II';
    testAccount.lp = 75;
    testAccount.isSpecial = true; // Ensure this is set

    await testAccount.save();
    console.log(`✅ Set rank to: ${testAccount.tier} ${testAccount.division} ${testAccount.lp}LP`);

    // Process match history to trigger immunity check
    const matchResult = await processAccountMatchHistory(testAccount);
    console.log(`✅ Match history processing result: ${matchResult.updated ? 'Updated' : 'No changes'}`);

    // Reload account
    testAccount = await LeagueAccount.findById(testAccount._id);
    console.log(`   New state: Decay days: ${testAccount.remainingDecayDays}, Is decaying: ${testAccount.isDecaying}, Is special: ${testAccount.isSpecial}`);

    if (testAccount.remainingDecayDays === -1) {
      console.log(`   🛡️  SUCCESS: Account is now immune to decay!`);
    } else {
      console.log(`   ❌ FAILED: Account should be immune but decay days = ${testAccount.remainingDecayDays}`);
    }

    // Step 4: Simulate playing games - should reset to 28 days and clear isSpecial
    console.log('\n🔄 Step 4: Simulating playing games (should reset to 28 days)');
    
    // Update last game ID to simulate new games
    const oldGameId = testAccount.lastSoloDuoGameId;
    testAccount.lastSoloDuoGameId = 'NEW_GAME_ID_' + Date.now();

    await testAccount.save();

    // Process match history to trigger game played logic
    const gameResult = await processAccountMatchHistory(testAccount);
    console.log(`✅ Game played processing result: ${gameResult.updated ? 'Updated' : 'No changes'}`);

    // Reload account
    testAccount = await LeagueAccount.findById(testAccount._id);
    console.log(`   Final state: Decay days: ${testAccount.remainingDecayDays}, Is decaying: ${testAccount.isDecaying}, Is special: ${testAccount.isSpecial}`);

    if (testAccount.remainingDecayDays === 28 && !testAccount.isSpecial && !testAccount.isDecaying) {
      console.log(`   🎮 SUCCESS: Account reset to normal state after playing games!`);
    } else {
      console.log(`   ❌ FAILED: Account should be reset but current state doesn't match expected`);
    }

    console.log('\n✅ Special immunity flow test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Simulate decay processing
async function simulateDecayProcessing(account) {
  try {
    // This simulates the logic from the decay processing route
    if (account.remainingDecayDays === 0 && account.isDecaying) {
      if ((account.tier === 'MASTER' || account.tier === 'GRANDMASTER' || account.tier === 'CHALLENGER') && 
          account.lp < 75) {
        
        account.remainingDecayDays = 28;
        account.isDecaying = false;
        account.isSpecial = true;
        
        await account.save();
        
        return {
          success: true,
          message: 'Reset to 28 days and set isSpecial flag'
        };
      }
    }
    
    return {
      success: false,
      message: 'No decay reset applied'
    };
  } catch (error) {
    return {
      success: false,
      message: `Error: ${error.message}`
    };
  }
}

// Test immunity accounts
async function testImmunityAccounts() {
  try {
    console.log('\n🧪 Testing accounts with immunity...\n');

    // Find accounts with -1 decay days (immune)
    const immuneAccounts = await LeagueAccount.find({
      remainingDecayDays: -1,
      isActive: true
    });

    console.log(`📊 Found ${immuneAccounts.length} immune accounts`);

    if (immuneAccounts.length === 0) {
      console.log('ℹ️  No immune accounts found');
      return;
    }

    console.log('\n📝 Immune accounts:');
    immuneAccounts.forEach((account, index) => {
      console.log(`  ${index + 1}. ${account.riotId} (${account.tier}${account.division || ''} ${account.lp}LP)`);
      console.log(`     Decay days: ${account.remainingDecayDays} (IMMUNE)`);
      console.log(`     Is decaying: ${account.isDecaying}`);
      console.log(`     Is special: ${account.isSpecial}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test special accounts
async function testSpecialAccounts() {
  try {
    console.log('\n🧪 Testing accounts with isSpecial flag...\n');

    // Find accounts with isSpecial flag
    const specialAccounts = await LeagueAccount.find({
      isSpecial: true,
      isActive: true
    });

    console.log(`📊 Found ${specialAccounts.length} special accounts`);

    if (specialAccounts.length === 0) {
      console.log('ℹ️  No special accounts found');
      return;
    }

    console.log('\n📝 Special accounts:');
    specialAccounts.forEach((account, index) => {
      console.log(`  ${index + 1}. ${account.riotId} (${account.tier}${account.division || ''} ${account.lp}LP)`);
      console.log(`     Decay days: ${account.remainingDecayDays}`);
      console.log(`     Is decaying: ${account.isDecaying}`);
      console.log(`     Is special: ${account.isSpecial}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the tests
async function runTests() {
  await connectDB();
  await testSpecialImmunityFlow();
  await testImmunityAccounts();
  await testSpecialAccounts();
  await mongoose.disconnect();
  console.log('\n✅ All tests completed');
}

runTests(); 
