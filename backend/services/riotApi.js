import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const RIOT_API_KEY = process.env.RIOT_API_KEY;

// Base URLs for different Riot API endpoints
const BASE_URLS = {
  AMERICAS: 'https://americas.api.riotgames.com',
  ASIA: 'https://asia.api.riotgames.com',
  EUROPE: 'https://europe.api.riotgames.com',
  SEA: 'https://sea.api.riotgames.com'
};

// Regional routing values
const REGIONAL_ROUTING = {
  NA1: 'AMERICAS',
  LA1: 'AMERICAS',
  LA2: 'AMERICAS',
  BR1: 'AMERICAS',
  KR: 'ASIA',
  JP1: 'ASIA',
  EUN1: 'EUROPE',
  EUW1: 'EUROPE',
  TR1: 'EUROPE',
  RU: 'EUROPE',
  OC1: 'SEA',
  PH2: 'SEA',
  SG2: 'SEA',
  TH2: 'SEA',
  VN2: 'SEA',
  TW2: 'SEA'
};

// Platform routing values
const PLATFORM_ROUTING = {
  NA1: 'na1',
  LA1: 'la1',
  LA2: 'la2',
  BR1: 'br1',
  KR: 'kr',
  JP1: 'jp1',
  EUN1: 'eun1',
  EUW1: 'euw1',
  TR1: 'tr1',
  RU: 'ru',
  OC1: 'oc1',
  PH2: 'ph2',
  SG2: 'sg2',
  TH2: 'th2',
  VN2: 'vn2',
  TW2: 'tw2'
};

// Create axios instance with default config
const createRiotApiClient = (baseURL) => {
  return axios.create({
    baseURL,
    headers: {
      'X-Riot-Token': RIOT_API_KEY,
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.7',
      'Accept-Charset': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Origin': 'https://developer.riotgames.com'
    },
    timeout: 10000
  });
};

// Get account information by game name and tag line
export const getRiotAccountInfo = async (gameName, tagLine, region) => {
  try {
    if (!RIOT_API_KEY) {
      throw new Error('Riot API key not configured');
    }

    const regionalRouting = REGIONAL_ROUTING[region];
    if (!regionalRouting) {
      throw new Error(`Invalid region: ${region}`);
    }

    const baseURL = BASE_URLS[regionalRouting];
    const client = createRiotApiClient(baseURL);

    // Updated endpoint format: /riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}
    const response = await client.get(`/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`);

    return {
      puuid: response.data.puuid,
      gameName: response.data.gameName,
      tagLine: response.data.tagLine,
      name: response.data.name
    };
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Account not found');
    }
    if (error.response?.status === 403) {
      throw new Error('Invalid API key');
    }
    if (error.response?.status === 429) {
      throw new Error('Rate limit exceeded');
    }
    throw new Error(`Failed to get account info: ${error.message}`);
  }
};

// Get summoner information by PUUID
export const getSummonerInfo = async (puuid, region) => {
  try {
    if (!RIOT_API_KEY) {
      throw new Error('Riot API key not configured');
    }

    const platformRouting = PLATFORM_ROUTING[region];
    if (!platformRouting) {
      throw new Error(`Invalid region: ${region}`);
    }

    const baseURL = `https://${platformRouting}.api.riotgames.com`;
    const client = createRiotApiClient(baseURL);

    const response = await client.get(`/lol/summoner/v4/summoners/by-puuid/${puuid}`);

    return {
      id: response.data.id,
      accountId: response.data.accountId,
      puuid: response.data.puuid,
      name: response.data.name,
      profileIconId: response.data.profileIconId,
      revisionDate: response.data.revisionDate,
      summonerLevel: response.data.summonerLevel
    };
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Summoner not found');
    }
    throw new Error(`Failed to get summoner info: ${error.message}`);
  }
};

// Get rank information by summoner ID
export const getRiotRankInfo = async (puuid, region) => {
  try {
    if (!RIOT_API_KEY) {
      throw new Error('Riot API key not configured');
    }

    const platformRouting = PLATFORM_ROUTING[region];
    if (!platformRouting) {
      throw new Error(`Invalid region: ${region}`);
    }

    const baseURL = `https://${platformRouting}.api.riotgames.com`;
    const client = createRiotApiClient(baseURL);

    const response = await client.get(`/lol/league/v4/entries/by-puuid/${puuid}`);

    // Find solo/duo queue entry
    const soloDuoEntry = response.data.find(entry => entry.queueType === 'RANKED_SOLO_5x5');
    
    if (!soloDuoEntry) {
      return {
        tier: null,
        division: null,
        lp: 0,
        wins: 0,
        losses: 0,
        leaguePoints: 0
      };
    }

    return {
      tier: soloDuoEntry.tier,
      division: soloDuoEntry.rank,
      lp: soloDuoEntry.leaguePoints,
      wins: soloDuoEntry.wins,
      losses: soloDuoEntry.losses,
      leaguePoints: soloDuoEntry.leaguePoints
    };
  } catch (error) {
    if (error.response?.status === 404) {
      // Return unranked if no rank data found
      return {
        tier: null,
        division: null,
        lp: 0,
        wins: 0,
        losses: 0,
        leaguePoints: 0
      };
    }
    throw new Error(`Failed to get rank info: ${error.message}`);
  }
};

// Get match history by PUUID
export const getMatchHistory = async (puuid, region, count = 20) => {
  try {
    if (!RIOT_API_KEY) {
      throw new Error('Riot API key not configured');
    }

    const regionalRouting = REGIONAL_ROUTING[region];
    if (!regionalRouting) {
      throw new Error(`Invalid region: ${region}`);
    }

    const baseURL = BASE_URLS[regionalRouting];
    const client = createRiotApiClient(baseURL);

    const response = await client.get(`/lol/match/v5/matches/by-puuid/${puuid}/ids`, {
      params: {
        count: count,
        queue: 420 // Ranked Solo/Duo queue
      }
    });

    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }
    throw new Error(`Failed to get match history: ${error.message}`);
  }
};

// Get ranked solo/duo match history by PUUID
export const getRankedSoloDuoMatchHistory = async (puuid, region, count = 20) => {
  try {
    if (!RIOT_API_KEY) {
      throw new Error('Riot API key not configured');
    }

    const regionalRouting = REGIONAL_ROUTING[region];
    if (!regionalRouting) {
      throw new Error(`Invalid region: ${region}`);
    }

    const baseURL = BASE_URLS[regionalRouting];
    const client = createRiotApiClient(baseURL);

    const response = await client.get(`/lol/match/v5/matches/by-puuid/${puuid}/ids`, {
      params: {
        count: count,
        queue: 420, // Ranked Solo/Duo queue
        type: 'ranked'
      }
    });

    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }
    throw new Error(`Failed to get ranked solo/duo match history: ${error.message}`);
  }
};

// Get match details by match ID
export const getMatchDetails = async (matchId, region) => {
  try {
    if (!RIOT_API_KEY) {
      throw new Error('Riot API key not configured');
    }

    const regionalRouting = REGIONAL_ROUTING[region];
    if (!regionalRouting) {
      throw new Error(`Invalid region: ${region}`);
    }

    const baseURL = BASE_URLS[regionalRouting];
    const client = createRiotApiClient(baseURL);

    const response = await client.get(`/lol/match/v5/matches/${matchId}`);

    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('Match not found');
    }
    throw new Error(`Failed to get match details: ${error.message}`);
  }
};

// Calculate decay days based on last game
export const calculateDecayDays = async (puuid, region) => {
  try {
    // Get recent matches
    const matchIds = await getMatchHistory(puuid, region, 5);
    
    if (matchIds.length === 0) {
      return 0; // No recent games, likely decayed
    }

    // Get the most recent match
    const latestMatch = await getMatchDetails(matchIds[0], region);
    const gameEndTime = new Date(latestMatch.info.gameEndTimestamp);
    const now = new Date();
    
    // Calculate days since last game
    const daysSinceLastGame = Math.floor((now - gameEndTime) / (1000 * 60 * 60 * 24));
    
    // Decay starts after 28 days of inactivity
    const decayDays = Math.max(0, 28 - daysSinceLastGame);
    
    return decayDays;
  } catch (error) {
    console.error('Error calculating decay days:', error);
    return 28; // Default to 28 days if calculation fails
  }
};

// Process match history and update decay for a single account
export const processAccountMatchHistory = async (account) => {
  try {
    console.log(`🔄 Processing match history for: ${account.gameName}#${account.tagLine} (${account.tier}${account.division || ''})`);

    // First, update account details from Riot API
    try {
      const summonerInfo = await getSummonerInfo(account.puuid, account.region);
      const rankInfo = await getRiotRankInfo(account.puuid, account.region);

      // Update account with fresh data
      account.summonerIcon = summonerInfo.profileIconId || account.summonerIcon;
      account.summonerLevel = summonerInfo.summonerLevel || account.summonerLevel;
      account.tier = rankInfo.tier || account.tier;
      account.division = rankInfo.division || account.division;
      account.lp = rankInfo.lp || account.lp;
      account.lastUpdated = new Date();

      console.log(`   📊 Updated rank: ${account.tier}${account.division || ''} ${account.lp}LP`);

      // Check for special immunity case: D2 75LP with isSpecial flag
      if (account.isSpecial && account.tier === 'DIAMOND' && account.division === 'II' && account.lp === 75) {
        account.remainingDecayDays = -1; // Set immunity
        console.log(`   🛡️  ${account.riotId} reached D2 75LP with isSpecial flag - setting immunity (decay days: -1)`);
      }

      // Check for Diamond decay to Emerald: set decay days to -1 (no decay for Emerald)
      if (account.tier === 'EMERALD') {
        account.remainingDecayDays = -1; // Set immunity for Emerald
        console.log(`   🛡️  ${account.riotId} is now Emerald - setting immunity (decay days: -1)`);
      }

      // Check for Emerald promotion to Diamond: reset decay days to 28
      if (account.tier === 'DIAMOND' && account.remainingDecayDays === -1) {
        account.remainingDecayDays = 28; // Reset to 28 days for Diamond
        console.log(`   🎯 ${account.riotId} promoted to Diamond - reset to 28 decay days`);
      }
    } catch (updateError) {
      console.warn(`   ⚠️  Could not update account details: ${updateError.message}`);
      // Continue with match history processing even if rank update fails
    }

    // Get ranked solo/duo match history
    const matchIds = await getRankedSoloDuoMatchHistory(account.puuid, account.region, 20);

    if (matchIds.length === 0) {
      console.log(`   ⏭️  No ranked solo/duo matches found`);
      
      // Save account to persist rank updates even if no matches found
      await account.save();
      
      return {
        updated: false,
        message: 'No ranked solo/duo matches found',
        gamesPlayed: 0,
        decayDaysAdded: 0,
        isSpecial: account.isSpecial,
        rankUpdated: true
      };
    }

    // Find the latest game ID
    const latestGameId = matchIds[0];

    // If we have a lastSoloDuoGameId, count games played after that
    let gamesPlayed = 0;
    if (account.lastSoloDuoGameId) {
      // Find the index of the last known game
      const lastGameIndex = matchIds.findIndex(id => id === account.lastSoloDuoGameId);
      
      if (lastGameIndex === -1) {
        // Last known game not found in recent history, assume all games are new
        gamesPlayed = matchIds.length;
      } else {
        // Count games played after the last known game
        gamesPlayed = lastGameIndex;
      }
    } else {
      // No previous game recorded, assume all games are new
      gamesPlayed = matchIds.length;
    }

    console.log(`   📊 Found ${gamesPlayed} new games played`);

    if (gamesPlayed > 0) {
      // Calculate decay days to add based on tier
      let decayDaysToAdd = 0;
      let maxDecayDays = 28;

      if (account.tier === 'DIAMOND') {
        decayDaysToAdd = gamesPlayed * 7;
        maxDecayDays = 28;
      } else if (account.tier === 'MASTER' || account.tier === 'GRANDMASTER' || account.tier === 'CHALLENGER') {
        decayDaysToAdd = gamesPlayed * 1;
        maxDecayDays = 14;
      }

              if (decayDaysToAdd > 0) {
          // Update decay days
          const previousDecayDays = account.remainingDecayDays;
          
          // Handle special immunity case: if account was immune (-1) and now plays games
          if (previousDecayDays === -1) {
            account.remainingDecayDays = 28; // Reset to 28 days
            account.isSpecial = false; // Clear special flag
            account.isDecaying = false;
            console.log(`   🎮 ${account.riotId} was immune but played games - reset to 28 days, cleared isSpecial flag`);
          } else {
            account.remainingDecayDays = Math.min(maxDecayDays, account.remainingDecayDays + decayDaysToAdd);
          }
          
          // Reset isDecaying flag since games were played
          account.isDecaying = false;
          
          // Update last game ID
          account.lastSoloDuoGameId = latestGameId;

          await account.save();

          console.log(`   ✅ Decay days: ${previousDecayDays} → ${account.remainingDecayDays} (added ${decayDaysToAdd})`);
          console.log(`   ✅ Reset isDecaying flag to false`);

          return {
            updated: true,
            gamesPlayed: gamesPlayed,
            previousDecayDays: previousDecayDays,
            currentDecayDays: account.remainingDecayDays,
            decayDaysAdded: decayDaysToAdd,
            latestGameId: latestGameId,
            isDecaying: false,
            isSpecial: account.isSpecial,
            rankUpdated: true
          };
        }
    }

    // Update last game ID even if no decay changes
    if (account.lastSoloDuoGameId !== latestGameId) {
      account.lastSoloDuoGameId = latestGameId;
      
      // Reset isDecaying flag if games were played (even if no decay days added)
      if (gamesPlayed > 0) {
        account.isDecaying = false;
        
        // Handle special immunity case: if account was immune (-1) and now plays games
        if (account.remainingDecayDays === -1) {
          account.remainingDecayDays = 28; // Reset to 28 days
          account.isSpecial = false; // Clear special flag
          console.log(`   🎮 ${account.riotId} was immune but played games - reset to 28 days, cleared isSpecial flag`);
        }
        
        console.log(`   ✅ Reset isDecaying flag to false (games played but no decay days added)`);
      }
      
      await account.save();
      console.log(`   📝 Updated latest game ID to: ${latestGameId}`);
    } else {
      // Even if no match history changes, save the account to persist rank updates
      await account.save();
    }

    return {
      updated: false,
      gamesPlayed: gamesPlayed,
      decayDaysAdded: 0,
      latestGameId: latestGameId,
      isDecaying: account.isDecaying,
      isSpecial: account.isSpecial,
      rankUpdated: true
    };

  } catch (error) {
    console.error(`   ❌ Error processing account ${account._id}:`, error.message);
    throw error;
  }
};

// Validate Riot API key
export const validateApiKey = async () => {
  try {
    if (!RIOT_API_KEY) {
      return { valid: false, message: 'API key not configured' };
    }

    // Test with a simple API call using the new format
    const client = createRiotApiClient('https://americas.api.riotgames.com');
    await client.get('/riot/account/v1/accounts/by-riot-id/test/test');

    return { valid: true, message: 'API key is valid' };
  } catch (error) {
    if (error.response?.status === 403) {
      return { valid: false, message: 'Invalid API key' };
    }
    if (error.response?.status === 429) {
      return { valid: false, message: 'Rate limit exceeded' };
    }
    if (error.response?.status === 404) {
      // 404 is expected for test/test, so API key is valid
      return { valid: true, message: 'API key appears valid' };
    }
    return { valid: false, message: `API key validation failed: ${error.message}` };
  }
}; 
 