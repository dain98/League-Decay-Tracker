import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const RIOT_API_KEY = process.env.RIOT_API_KEY;

const testDirectAPI = async () => {
  console.log('🧪 Testing Direct Riot API Calls...\n');

  try {
    // Test 1: Direct account lookup with correct endpoint format
    console.log('1. Testing direct account lookup...');
    const accountResponse = await axios.get('https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/eden/iino', {
      headers: {
        'X-Riot-Token': RIOT_API_KEY,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.7',
        'Accept-Charset': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': 'https://developer.riotgames.com'
      }
    });

    console.log('   ✅ Account found!');
    console.log(`   PUUID: ${accountResponse.data.puuid}`);
    console.log(`   Game Name: ${accountResponse.data.gameName}`);
    console.log(`   Tag Line: ${accountResponse.data.tagLine}\n`);

    // Test 2: Direct rank lookup
    console.log('2. Testing direct rank lookup...');
    const rankResponse = await axios.get(`https://na1.api.riotgames.com/lol/league/v4/entries/by-puuid/${accountResponse.data.puuid}`, {
      headers: {
        'X-Riot-Token': RIOT_API_KEY,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.7',
        'Accept-Charset': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': 'https://developer.riotgames.com'
      }
    });

    console.log('   ✅ Rank data retrieved!');
    const soloDuoEntry = rankResponse.data.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
    
    if (soloDuoEntry) {
      console.log(`   Tier: ${soloDuoEntry.tier}`);
      console.log(`   Division: ${soloDuoEntry.rank}`);
      console.log(`   LP: ${soloDuoEntry.leaguePoints}`);
      console.log(`   Wins: ${soloDuoEntry.wins}`);
      console.log(`   Losses: ${soloDuoEntry.losses}`);
    } else {
      console.log('   No ranked solo/duo data found');
    }

    console.log('\n🎉 Direct API tests successful! Your account data can be retrieved.');

  } catch (error) {
    console.error('❌ Direct API test failed:', error.message);
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
      
      if (error.response.status === 403) {
        console.log('\n🔑 API Key Issue:');
        console.log('- Your API key may be expired (development keys last 24 hours)');
        console.log('- Get a new key from: https://developer.riotgames.com/');
      }
    }
  }
};

testDirectAPI(); 
