import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const RIOT_API_KEY = process.env.RIOT_API_KEY;

// Validate required environment variables
if (!RIOT_API_KEY) {
  console.error('RIOT_API_KEY environment variable is required');
  throw new Error('Missing required environment variable: RIOT_API_KEY');
}

// Base URLs for different Riot API endpoints
const BASE_URLS = {
  AMERICAS: 'https://americas.api.riotgames.com',
  ASIA: 'https://asia.api.riotgames.com',
  EUROPE: 'https://europe.api.riotgames.com',
  SEA: 'https://sea.api.riotgames.com'
};

// Regional routing values (only supported regions)
const REGIONAL_ROUTING = {
  NA1: 'AMERICAS',
  EUW1: 'EUROPE',
  KR: 'ASIA'
};

// Platform routing values (only supported regions)
const PLATFORM_ROUTING = {
  NA1: 'na1',
  EUW1: 'euw1',
  KR: 'kr'
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

// --- Rate limit helper imports ---
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Token bucket for 20 req/sec and 100 req/2min
const RATE_LIMITS = [
  { max: 20, windowMs: 1000, tokens: 20, lastRefill: Date.now() },
  { max: 100, windowMs: 120000, tokens: 100, lastRefill: Date.now() }
];

async function acquireRiotApiToken() {
  let attempts = 0;
  const maxAttempts = 100; // Prevent infinite loops
  
  while (attempts < maxAttempts) {
    const now = Date.now();
    let canProceed = true;
    
    for (const limit of RATE_LIMITS) {
      // Refill tokens based on time elapsed
      const elapsed = now - limit.lastRefill;
      const tokensToAdd = Math.floor(elapsed / limit.windowMs) * limit.max;
      
      if (tokensToAdd > 0) {
        limit.tokens = Math.min(limit.max, limit.tokens + tokensToAdd);
        limit.lastRefill = now;
      }
      
      if (limit.tokens <= 0) {
        canProceed = false;
        break;
      }
    }
    
    if (canProceed) {
      // Consume one token from each limit
      for (const limit of RATE_LIMITS) {
        limit.tokens--;
      }
      return;
    }
    
    // Wait before retrying
    await sleep(Math.min(1000, Math.min(...RATE_LIMITS.map(l => l.windowMs)) / 10));
    attempts++;
  }
  
  throw new Error('Rate limit acquisition failed after maximum attempts');
}

async function riotApiRequest(requestFn) {
  let attempts = 0;
  const maxAttempts = 5;
  
  while (attempts < maxAttempts) {
    try {
      await acquireRiotApiToken();
      return await requestFn();
    } catch (error) {
      attempts++;
      
      if (error.response?.status === 429) {
        // Check Retry-After header
        let wait = 2000;
        const retryAfter = error.response.headers['retry-after'];
        if (retryAfter) {
          // Retry-After can be seconds or a date
          const parsed = parseInt(retryAfter, 10);
          if (!isNaN(parsed)) {
            wait = parsed * 1000;
          }
        }
        
        if (attempts >= maxAttempts) {
          throw new Error(`Rate limit exceeded after ${maxAttempts} attempts`);
        }
        
        await sleep(wait);
        continue;
      }
      
      // For non-429 errors, don't retry
      throw error;
    }
  }
  
  throw new Error(`API request failed after ${maxAttempts} attempts`);
}

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
    const response = await riotApiRequest(() => client.get(`/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`));

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

    const response = await riotApiRequest(() => client.get(`/lol/summoner/v4/summoners/by-puuid/${puuid}`));

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

    const response = await riotApiRequest(() => client.get(`/lol/league/v4/entries/by-puuid/${puuid}`));

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

    const response = await riotApiRequest(() => client.get(`/lol/match/v5/matches/by-puuid/${puuid}/ids`, {
      params: {
        count: count,
        queue: 420 // Ranked Solo/Duo queue
      }
    }));

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

    const response = await riotApiRequest(() => client.get(`/lol/match/v5/matches/by-puuid/${puuid}/ids`, {
      params: {
        count: count,
        queue: 420, // Ranked Solo/Duo queue
        type: 'ranked'
      }
    }));

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

    const response = await riotApiRequest(() => client.get(`/lol/match/v5/matches/${matchId}`));

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
export const processAccountMatchHistory = async (leagueAccount, userAccount = null) => {
  try {
    // Check if region is supported
    if (!REGIONAL_ROUTING[leagueAccount.region]) {
      console.log(`⏭️  Skipping ${leagueAccount.gameName}#${leagueAccount.tagLine} - unsupported region: ${leagueAccount.region}`);
      return {
        updated: false,
        message: `Unsupported region: ${leagueAccount.region}`,
        gamesPlayed: 0,
        decayDaysAdded: 0,
        isSpecial: userAccount?.isSpecial || false,
        rankUpdated: false
      };
    }

    console.log(`🔄 Processing match history for: ${leagueAccount.gameName}#${leagueAccount.tagLine} (${leagueAccount.tier}${leagueAccount.division || ''})`);

    // First, update account details from Riot API
    try {
      const summonerInfo = await getSummonerInfo(leagueAccount.puuid, leagueAccount.region);
      const rankInfo = await getRiotRankInfo(leagueAccount.puuid, leagueAccount.region);

      // Store previous tier for promotion detection
      const previousTier = leagueAccount.tier;
      
      // Update shared account with fresh data
      leagueAccount.summonerIcon = summonerInfo.profileIconId || leagueAccount.summonerIcon;
      leagueAccount.summonerLevel = summonerInfo.summonerLevel || leagueAccount.summonerLevel;
      leagueAccount.tier = rankInfo.tier || leagueAccount.tier;
      leagueAccount.division = rankInfo.division || leagueAccount.division;
      leagueAccount.lp = rankInfo.lp || leagueAccount.lp;
      leagueAccount.lastUpdated = new Date();

      console.log(`   📊 Updated rank: ${leagueAccount.tier}${leagueAccount.division || ''} ${leagueAccount.lp}LP`);

      // If we have a user account, update user-specific decay logic
      if (userAccount) {
        // Check for special immunity case: D2 75LP with isSpecial flag
        if (userAccount.isSpecial && leagueAccount.tier === 'DIAMOND' && leagueAccount.division === 'II' && leagueAccount.lp === 75) {
          userAccount.remainingDecayDays = -1; // Set immunity
          console.log(`   🛡️  ${leagueAccount.riotId} reached D2 75LP with isSpecial flag - setting immunity (decay days: -1)`);
        }

        // Check for Diamond decay to Emerald: set decay days to -1 (no decay for Emerald)
        if (leagueAccount.tier === 'EMERALD') {
          userAccount.remainingDecayDays = -1; // Set immunity for Emerald
          console.log(`   🛡️  ${leagueAccount.riotId} is now Emerald - setting immunity (decay days: -1)`);
        }

        // Check for Emerald promotion to Diamond: reset decay days to 28
        // Only if the account was previously Emerald (not if it was already Diamond and just got set to immune)
        if (leagueAccount.tier === 'DIAMOND' && previousTier === 'EMERALD' && userAccount.remainingDecayDays === -1) {
          userAccount.remainingDecayDays = 28; // Reset to 28 days for Diamond
          console.log(`   🎯 ${leagueAccount.riotId} promoted from Emerald to Diamond - reset to 28 decay days`);
        }

        // Check for Diamond promotion to Master: reset decay days to 14
        // Only if the account was previously Diamond (not if it was already Master and just got updated)
        if (leagueAccount.tier === 'MASTER' && previousTier === 'DIAMOND') {
          userAccount.remainingDecayDays = 14; // Reset to 14 days for Master
          console.log(`   🎯 ${leagueAccount.riotId} promoted from Diamond to Master - reset to 14 decay days`);
        }
      }
    } catch (updateError) {
      console.warn(`   ⚠️  Could not update account details: ${updateError.message}`);
      // Continue with match history processing even if rank update fails
    }

    // Get ranked solo/duo match history
    const matchIds = await getRankedSoloDuoMatchHistory(leagueAccount.puuid, leagueAccount.region, 20);

    if (matchIds.length === 0) {
      console.log(`   ⏭️  No ranked solo/duo matches found`);
      
      // Save both accounts to persist rank updates and any decay logic changes
      if (userAccount) {
        await Promise.all([leagueAccount.save(), userAccount.save()]);
      } else {
        await leagueAccount.save();
      }
      
      return {
        updated: false,
        message: 'No ranked solo/duo matches found',
        gamesPlayed: 0,
        decayDaysAdded: 0,
        isSpecial: userAccount?.isSpecial || false,
        rankUpdated: true
      };
    }

    // Find the latest game ID
    const latestGameId = matchIds[0];

    // If we have a lastSoloDuoGameId, count games played after that
    let gamesPlayed = 0;
    if (leagueAccount.lastSoloDuoGameId) {
      // Find the index of the last known game
      const lastGameIndex = matchIds.findIndex(id => id === leagueAccount.lastSoloDuoGameId);
      
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

    if (gamesPlayed > 0 && userAccount) {
      // Calculate decay days to add based on tier
      let decayDaysToAdd = 0;
      let maxDecayDays = 28;

      if (leagueAccount.tier === 'DIAMOND') {
        decayDaysToAdd = gamesPlayed * 7;
        maxDecayDays = 28;
      } else if (leagueAccount.tier === 'MASTER' || leagueAccount.tier === 'GRANDMASTER' || leagueAccount.tier === 'CHALLENGER') {
        decayDaysToAdd = gamesPlayed * 1;
        maxDecayDays = 14;
      }

      if (decayDaysToAdd > 0) {
        // Update decay days
        const previousDecayDays = userAccount.remainingDecayDays;
        
        // Handle special immunity case: if account was immune (-1) and now plays games
        if (previousDecayDays === -1) {
          userAccount.remainingDecayDays = 28; // Reset to 28 days
          userAccount.isSpecial = false; // Clear special flag
          userAccount.isDecaying = false;
          console.log(`   🎮 ${leagueAccount.riotId} was immune but played games - reset to 28 days, cleared isSpecial flag`);
        } else {
          userAccount.remainingDecayDays = Math.min(maxDecayDays, userAccount.remainingDecayDays + decayDaysToAdd);
        }
        
        // Reset isDecaying flag since games were played
        userAccount.isDecaying = false;
        
        // Update last game ID in shared account
        leagueAccount.lastSoloDuoGameId = latestGameId;

        await Promise.all([leagueAccount.save(), userAccount.save()]);

        console.log(`   ✅ Decay days: ${previousDecayDays} → ${userAccount.remainingDecayDays} (added ${decayDaysToAdd})`);
        console.log(`   ✅ Reset isDecaying flag to false`);

        return {
          updated: true,
          gamesPlayed: gamesPlayed,
          previousDecayDays: previousDecayDays,
          currentDecayDays: userAccount.remainingDecayDays,
          decayDaysAdded: decayDaysToAdd,
          latestGameId: latestGameId,
          isDecaying: false,
          isSpecial: userAccount.isSpecial,
          rankUpdated: true
        };
      }
    }

    // Update last game ID even if no decay changes
    if (leagueAccount.lastSoloDuoGameId !== latestGameId) {
      leagueAccount.lastSoloDuoGameId = latestGameId;
      
      // Reset isDecaying flag if games were played (even if no decay days added)
      if (gamesPlayed > 0 && userAccount) {
        userAccount.isDecaying = false;
        
        // Handle special immunity case: if account was immune (-1) and now plays games
        if (userAccount.remainingDecayDays === -1) {
          userAccount.remainingDecayDays = 28; // Reset to 28 days
          userAccount.isSpecial = false; // Clear special flag
          console.log(`   🎮 ${leagueAccount.riotId} was immune but played games - reset to 28 days, cleared isSpecial flag`);
        }
        
        console.log(`   ✅ Reset isDecaying flag to false (games played but no decay days added)`);
      }
      
      await leagueAccount.save();
      if (userAccount) {
        await userAccount.save();
      }
      console.log(`   📝 Updated latest game ID to: ${latestGameId}`);
    } else {
      // Even if no match history changes, save both accounts to persist rank updates and any decay logic changes
      if (userAccount) {
        await Promise.all([leagueAccount.save(), userAccount.save()]);
      } else {
        await leagueAccount.save();
      }
    }

    return {
      updated: false,
      gamesPlayed: gamesPlayed,
      decayDaysAdded: 0,
      latestGameId: latestGameId,
      isDecaying: userAccount?.isDecaying || false,
      isSpecial: userAccount?.isSpecial || false,
      rankUpdated: true
    };

  } catch (error) {
    console.error(`   ❌ Error processing account ${leagueAccount._id}:`, error.message);
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
    await riotApiRequest(() => client.get('/riot/account/v1/accounts/by-riot-id/test/test'));

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
 