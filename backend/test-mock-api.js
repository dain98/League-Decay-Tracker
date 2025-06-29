import dotenv from 'dotenv';
import { connectDB, User, LeagueAccount } from './database/index.js';

dotenv.config();

const testMockAPI = async () => {
  console.log('🧪 Testing Backend with Mock Data...\n');

  try {
    // Connect to database
    await connectDB();
    console.log('✅ Database connected\n');

    // Test 1: Create a mock user
    console.log('1. Testing user creation...');
    const mockAuth0User = {
      sub: 'auth0|test-user-123',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg',
      email_verified: true,
      nickname: 'testuser'
    };

    const user = await User.findOrCreateFromAuth0(mockAuth0User);
    console.log('   ✅ User created/updated successfully!');
    console.log(`   User ID: ${user._id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}\n`);

    // Test 2: Create a mock league account
    console.log('2. Testing league account creation...');
    const mockLeagueAccount = new LeagueAccount({
      userId: user._id,
      puuid: 'mock-puuid-123456789',
      summonerIcon: 1,
      gameName: 'eden',
      tagLine: 'iino',
      region: 'NA1',
      remainingDecayDays: 15,
      division: 'II',
      tier: 'GOLD',
      lp: 1250,
      summonerLevel: 150,
      isActive: true
    });

    await mockLeagueAccount.save();
    console.log('   ✅ League account created successfully!');
    console.log(`   Account ID: ${mockLeagueAccount._id}`);
    console.log(`   Riot ID: ${mockLeagueAccount.riotId}`);
    console.log(`   Rank: ${mockLeagueAccount.rankDisplay}`);
    console.log(`   Decay Status: ${mockLeagueAccount.decayStatus}`);
    console.log(`   Decay Days: ${mockLeagueAccount.remainingDecayDays}\n`);

    // Test 3: Test account retrieval
    console.log('3. Testing account retrieval...');
    const accounts = await LeagueAccount.findByUserId(user._id);
    console.log(`   ✅ Found ${accounts.length} account(s) for user`);
    
    accounts.forEach((account, index) => {
      console.log(`   Account ${index + 1}:`);
      console.log(`     Riot ID: ${account.riotId}`);
      console.log(`     Region: ${account.region}`);
      console.log(`     Rank: ${account.rankDisplay}`);
      console.log(`     Decay Days: ${account.remainingDecayDays}`);
      console.log(`     Status: ${account.decayStatus}`);
    });

    // Test 4: Test user statistics
    console.log('\n4. Testing user statistics...');
    const userWithAccounts = await user.populate('leagueAccounts');
    const leagueAccounts = userWithAccounts.leagueAccounts || [];

    const stats = {
      totalAccounts: leagueAccounts.length,
      activeAccounts: leagueAccounts.filter(acc => acc.isActive).length,
      criticalDecay: leagueAccounts.filter(acc => acc.remainingDecayDays <= 3).length,
      warningDecay: leagueAccounts.filter(acc => acc.remainingDecayDays <= 7 && acc.remainingDecayDays > 3).length,
      safeAccounts: leagueAccounts.filter(acc => acc.remainingDecayDays > 7).length,
      regions: [...new Set(leagueAccounts.map(acc => acc.region))],
      averageDecayDays: leagueAccounts.length > 0 
        ? Math.round(leagueAccounts.reduce((sum, acc) => sum + acc.remainingDecayDays, 0) / leagueAccounts.length)
        : 0
    };

    console.log('   ✅ User statistics calculated:');
    console.log(`     Total Accounts: ${stats.totalAccounts}`);
    console.log(`     Active Accounts: ${stats.activeAccounts}`);
    console.log(`     Critical Decay: ${stats.criticalDecay}`);
    console.log(`     Warning Decay: ${stats.warningDecay}`);
    console.log(`     Safe Accounts: ${stats.safeAccounts}`);
    console.log(`     Regions: ${stats.regions.join(', ')}`);
    console.log(`     Average Decay Days: ${stats.averageDecayDays}`);

    console.log('\n🎉 All backend functionality tests passed!');
    console.log('📋 Next steps:');
    console.log('1. Get a new Riot API key from https://developer.riotgames.com/');
    console.log('2. Update RIOT_API_KEY in your .env file');
    console.log('3. Test with real League account data');

  } catch (error) {
    console.error('❌ Mock test failed:', error.message);
    console.error('Full error:', error);
  }
};

testMockAPI(); 
