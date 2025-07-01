// Test script for Data Dragon service
// Run this in the browser console to test the service

import { getLatestVersion, getSummonerIconUrl, getSummonerIconUrlSync, clearVersionCache } from './services/ddragon.js';

// Test the service
async function testDataDragon() {
  console.log('🧪 Testing Data Dragon Service...');
  
  try {
    // Test 1: Get latest version
    console.log('📋 Test 1: Fetching latest version...');
    const version = await getLatestVersion();
    console.log('✅ Latest version:', version);
    
    // Test 2: Get summoner icon URL
    console.log('🖼️ Test 2: Getting summoner icon URL...');
    const iconUrl = await getSummonerIconUrl(1); // Test with icon ID 1
    console.log('✅ Icon URL:', iconUrl);
    
    // Test 3: Test synchronous version
    console.log('⚡ Test 3: Testing synchronous version...');
    const syncIconUrl = getSummonerIconUrlSync(1);
    console.log('✅ Sync Icon URL:', syncIconUrl);
    
    // Test 4: Test cache
    console.log('💾 Test 4: Testing cache...');
    const cachedVersion = await getLatestVersion();
    console.log('✅ Cached version (should be same):', cachedVersion);
    
    // Test 5: Clear cache and test again
    console.log('🗑️ Test 5: Clearing cache...');
    clearVersionCache();
    const freshVersion = await getLatestVersion();
    console.log('✅ Fresh version:', freshVersion);
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Export for use in browser console
window.testDataDragon = testDataDragon; 
