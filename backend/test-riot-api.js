import dotenv from 'dotenv';
import { getRiotAccountInfo, getRiotRankInfo, validateApiKey } from './services/riotApi.js';

dotenv.config();

const testRiotAPI = async () => {
  console.log('🧪 Testing Riot API Integration...\n');

  try {
    // Test 1: Validate API key
    console.log('1. Testing API key validation...');
    const keyValidation = await validateApiKey();
    console.log(`   API Key Status: ${keyValidation.valid ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`   Message: ${keyValidation.message}\n`);

    if (!keyValidation.valid) {
      console.log('❌ API key validation failed.');
      console.log('\n📋 To get a permanent API key:');
      console.log('1. Go to https://developer.riotgames.com/');
      console.log('2. Sign in with your Riot account');
      console.log('3. Go to "Development API Key"');
      console.log('4. Copy your permanent API key');
      console.log('5. Update RIOT_API_KEY in your .env file\n');
      return;
    }

    // Test 2: Get account info
    console.log('2. Testing account info retrieval...');
    const accountInfo = await getRiotAccountInfo('eden', 'iino', 'NA1');
    console.log('   ✅ Account info retrieved successfully!');
    console.log(`   PUUID: ${accountInfo.puuid}`);
    console.log(`   Game Name: ${accountInfo.gameName}`);
    console.log(`   Tag Line: ${accountInfo.tagLine}\n`);

    // Test 3: Get rank info
    console.log('3. Testing rank info retrieval...');
    const rankInfo = await getRiotRankInfo(accountInfo.puuid, 'NA1');
    console.log('   ✅ Rank info retrieved successfully!');
    console.log(`   Tier: ${rankInfo.tier || 'Unranked'}`);
    console.log(`   Division: ${rankInfo.division || 'N/A'}`);
    console.log(`   LP: ${rankInfo.lp}`);
    console.log(`   Wins: ${rankInfo.wins}`);
    console.log(`   Losses: ${rankInfo.losses}\n`);

    console.log('🎉 All Riot API tests passed! The backend is ready to handle League accounts.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.message.includes('Invalid API key')) {
      console.log('\n📋 To get a permanent API key:');
      console.log('1. Go to https://developer.riotgames.com/');
      console.log('2. Sign in with your Riot account');
      console.log('3. Go to "Development API Key"');
      console.log('4. Copy your permanent API key');
      console.log('5. Update RIOT_API_KEY in your .env file');
      console.log('\n💡 Note: Development keys (RGAPI-*) expire after 24 hours');
    }
  }
};

testRiotAPI(); 
