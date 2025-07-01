import dotenv from 'dotenv';
import axios from 'axios';
import { connectDB, User, LeagueAccount } from './database/index.js';

dotenv.config();

const API_BASE_URL = 'http://localhost:5000/api';

const testAPIEndpoints = async () => {
  console.log('🧪 Testing Backend API Endpoints...\n');

  try {
    // Connect to database
    await connectDB();
    console.log('✅ Database connected\n');

    // Test 1: Health check endpoint
    console.log('1. Testing health check endpoint...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('   ✅ Health check successful');
    console.log(`   Status: ${healthResponse.data.status}`);
    console.log(`   Database: ${healthResponse.data.services.database}\n`);

    // Test 2: Create a test user in database
    console.log('2. Creating test user in database...');
    const mockAuth0User = {
      sub: 'auth0|test-user-456',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg',
      email_verified: true,
      nickname: 'testuser'
    };

    const user = await User.findOrCreateFromAuth0(mockAuth0User);
    console.log('   ✅ Test user created/updated');
    console.log(`   User ID: ${user._id}`);
    console.log(`   Name: ${user.name}\n`);

    // Test 3: Test adding a league account (simulating the API call)
    console.log('3. Testing league account creation...');
    
    // Import the Riot API functions
    const { getRiotAccountInfo, getSummonerInfo, getRiotRankInfo } = await import('./services/riotApi.js');
    
    // Get account info from Riot API
    const riotAccountInfo = await getRiotAccountInfo('eden', 'iino', 'NA1');
    console.log('   ✅ Riot account info retrieved');
    console.log(`   PUUID: ${riotAccountInfo.puuid}`);
    
    // Get summoner info from Riot API
    const summonerInfo = await getSummonerInfo(riotAccountInfo.puuid, 'NA1');
    console.log('   ✅ Summoner info retrieved');
    console.log(`   Profile Icon ID: ${summonerInfo.profileIconId}`);
    console.log(`   Summoner Level: ${summonerInfo.summonerLevel}`);
    
    // Get rank info from Riot API
    const rankInfo = await getRiotRankInfo(riotAccountInfo.puuid, 'NA1');
    console.log('   ✅ Rank info retrieved');
    console.log(`   Tier: ${rankInfo.tier}`);
    console.log(`   Division: ${rankInfo.division}`);
    console.log(`   LP: ${rankInfo.lp}`);

    // Create league account in database
    const newAccount = new LeagueAccount({
      userId: user._id,
      puuid: riotAccountInfo.puuid,
      summonerIcon: summonerInfo.profileIconId || 1, // Use actual profile icon
      gameName: 'eden',
      tagLine: 'iino',
      region: 'NA1',
      summonerLevel: summonerInfo.summonerLevel || 150, // Use actual level
      tier: rankInfo.tier,
      division: rankInfo.division,
      lp: rankInfo.lp,
      remainingDecayDays: 28, // Default value
      isActive: true
    });

    await newAccount.save();
    console.log('   ✅ League account saved to database');
    console.log(`   Account ID: ${newAccount._id}`);
    console.log(`   Riot ID: ${newAccount.riotId}`);
    console.log(`   Rank: ${newAccount.rankDisplay}`);
    console.log(`   Decay Status: ${newAccount.decayStatus}\n`);

    // Test 4: Test account retrieval
    console.log('4. Testing account retrieval...');
    const accounts = await LeagueAccount.findByUserId(user._id);
    console.log(`   ✅ Found ${accounts.length} account(s) for user`);
    
    accounts.forEach((account, index) => {
      console.log(`   Account ${index + 1}:`);
      console.log(`     Riot ID: ${account.riotId}`);
      console.log(`     Region: ${account.region}`);
      console.log(`     Rank: ${account.rankDisplay}`);
      console.log(`     LP: ${account.lp}`);
      console.log(`     Decay Days: ${account.remainingDecayDays}`);
      console.log(`     Status: ${account.decayStatus}`);
    });

    // Test 5: Test user statistics
    console.log('\n5. Testing user statistics...');
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
    console.log('📋 Your backend is ready for:');
    console.log('1. Frontend integration');
    console.log('2. Real user authentication');
    console.log('3. League account management');
    console.log('4. Decay tracking');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
};

testAPIEndpoints(); 
