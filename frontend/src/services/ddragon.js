// Data Dragon API service for League of Legends static data
// https://ddragon.leagueoflegends.com/

let cachedVersion = null;
let versionCacheTime = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Fetch the latest Data Dragon version
export const getLatestVersion = async () => {
  // Check if we have a cached version that's still valid
  if (cachedVersion && versionCacheTime && (Date.now() - versionCacheTime) < CACHE_DURATION) {
    return cachedVersion;
  }

  try {
    const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch versions: ${response.status}`);
    }
    
    const versions = await response.json();
    if (!versions || versions.length === 0) {
      throw new Error('No versions returned from Data Dragon API');
    }
    
    // Cache the latest version (first in the array)
    cachedVersion = versions[0];
    versionCacheTime = Date.now();
    
    return cachedVersion;
  } catch (error) {
    console.error('Error fetching Data Dragon version:', error);
    
    // Fallback to a known recent version if API fails
    if (cachedVersion) {
      return cachedVersion;
    }
    
    // Ultimate fallback
    return '15.13.1';
  }
};

// Get summoner icon URL with latest version
export const getSummonerIconUrl = async (iconId) => {
  try {
    const version = await getLatestVersion();
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${iconId}.png`;
  } catch (error) {
    console.error('Error getting summoner icon URL:', error);
    // Fallback URL
    return `https://ddragon.leagueoflegends.com/cdn/15.13.1/img/profileicon/${iconId}.png`;
  }
};

// Get summoner icon URL with cached version (for synchronous use)
export const getSummonerIconUrlSync = (iconId) => {
  const version = cachedVersion || '15.13.1';
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${iconId}.png`;
};

// Clear version cache (useful for testing or forcing refresh)
export const clearVersionCache = () => {
  cachedVersion = null;
  versionCacheTime = null;
}; 
