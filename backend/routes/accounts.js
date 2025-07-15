import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { authenticateApiKey } from '../middleware/apiKey.js';
import { User, LeagueAccount, UserLeagueAccount } from '../database/index.js';
import { getRiotAccountInfo, getSummonerInfo, getRiotRankInfo, getRankedSoloDuoMatchHistory, processAccountMatchHistory } from '../services/riotApi.js';

const router = express.Router();

// Get all league accounts for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('--- /users/me/accounts route hit ---');
    const user = await User.findOne({ firebaseUid: req.user.sub });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log('About to call UserLeagueAccount.findByUserId with:', user._id);
    const userAccounts = await UserLeagueAccount.findByUserId(user._id);
    console.log('GET /users/me/accounts - userAccounts:', userAccounts);
    
    // Transform the data to match the expected format
    const accounts = userAccounts.map(userAccount => {
      const leagueAccount = userAccount.leagueAccountId;
      return {
        _id: userAccount._id,
        userId: userAccount.userId,
        puuid: leagueAccount.puuid,
        gameName: leagueAccount.gameName,
        tagLine: leagueAccount.tagLine,
        region: leagueAccount.region,
        summonerIcon: leagueAccount.summonerIcon,
        summonerLevel: leagueAccount.summonerLevel,
        tier: leagueAccount.tier,
        division: leagueAccount.division,
        lp: leagueAccount.lp,
        lastSoloDuoGameId: leagueAccount.lastSoloDuoGameId,
        remainingDecayDays: userAccount.remainingDecayDays,
        isActive: userAccount.isActive,
        isDecaying: userAccount.isDecaying,
        isSpecial: userAccount.isSpecial,
        lastUpdated: userAccount.lastUpdated,
        createdAt: userAccount.createdAt,
        // Add virtuals
        riotId: leagueAccount.riotId,
        rankDisplay: leagueAccount.rankDisplay,
        decayStatus: userAccount.decayStatus
      };
    });
    
    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    console.error('Error getting league accounts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get league accounts',
      message: error.message
    });
  }
});

// Get specific league account
router.get('/:id', [
  authenticateToken,
  param('id').isMongoId().withMessage('Invalid account ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const user = await User.findOne({ firebaseUid: req.user.sub });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userAccount = await UserLeagueAccount.findOne({
      _id: req.params.id,
      userId: user._id
    }).populate('leagueAccountId');

    if (!userAccount) {
      return res.status(404).json({
        success: false,
        error: 'League account not found'
      });
    }

    // Process match history and update decay if needed
    let matchHistoryResult = null;
    try {
      matchHistoryResult = await processAccountMatchHistory(userAccount.leagueAccountId, userAccount);
    } catch (matchError) {
      console.warn('Could not process match history for account:', matchError.message);
      // Continue without match history processing
    }

    // Transform the data to match the expected format
    const account = {
      _id: userAccount._id,
      userId: userAccount.userId,
      puuid: userAccount.leagueAccountId.puuid,
      gameName: userAccount.leagueAccountId.gameName,
      tagLine: userAccount.leagueAccountId.tagLine,
      region: userAccount.leagueAccountId.region,
      summonerIcon: userAccount.leagueAccountId.summonerIcon,
      summonerLevel: userAccount.leagueAccountId.summonerLevel,
      tier: userAccount.leagueAccountId.tier,
      division: userAccount.leagueAccountId.division,
      lp: userAccount.leagueAccountId.lp,
      lastSoloDuoGameId: userAccount.leagueAccountId.lastSoloDuoGameId,
      remainingDecayDays: userAccount.remainingDecayDays,
      isActive: userAccount.isActive,
      isDecaying: userAccount.isDecaying,
      isSpecial: userAccount.isSpecial,
      lastUpdated: userAccount.leagueAccountId.lastUpdated,
      createdAt: userAccount.createdAt,
      // Add virtuals
      riotId: userAccount.leagueAccountId.riotId,
      rankDisplay: userAccount.leagueAccountId.rankDisplay,
      decayStatus: userAccount.decayStatus
    };

    res.json({
      success: true,
      data: account,
      matchHistory: matchHistoryResult
    });
  } catch (error) {
    console.error('Error getting league account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get league account',
      message: error.message
    });
  }
});

// Add new league account
router.post('/', [
  authenticateToken,
  body('gameName').isString().trim().isLength({ min: 1, max: 50 }).withMessage('Game name is required'),
  body('tagLine').isString().trim().isLength({ min: 1, max: 10 }).withMessage('Tag line is required'),
  body('region').isIn(['NA1', 'EUW1', 'KR']).withMessage('Invalid region'),
  body('remainingDecayDays').isInt({ min: -1, max: 28 }).withMessage('Remaining decay days must be between -1 (immune) and 28'),
  body('isSpecial').optional().custom((value) => {
    if (value === undefined || value === null) return true;
    if (typeof value === 'boolean') return true;
    if (value === 'true' || value === 'false' || value === 'on' || value === 'off') return true;
    throw new Error('isSpecial must be a boolean value');
  }).withMessage('isSpecial must be a boolean'),
  body('isDecaying').optional().custom((value) => {
    if (value === undefined || value === null) return true;
    if (typeof value === 'boolean') return true;
    if (value === 'true' || value === 'false' || value === 'on' || value === 'off') return true;
    throw new Error('isDecaying must be a boolean value');
  }).withMessage('isDecaying must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const user = await User.findOne({ firebaseUid: req.user.sub });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const { gameName, tagLine, region, remainingDecayDays, isSpecial, isDecaying } = req.body;

    // Check if user already has this account
    const existingUserAccount = await UserLeagueAccount.findOne({
      userId: user._id,
      'leagueAccountId.gameName': gameName,
      'leagueAccountId.tagLine': tagLine,
      'leagueAccountId.region': region.toUpperCase()
    }).populate('leagueAccountId');

    if (existingUserAccount) {
      return res.status(409).json({
        success: false,
        error: 'Account already exists',
        message: 'This League account is already registered for your profile'
      });
    }

    // Get account info from Riot API
    try {
      const riotAccountInfo = await getRiotAccountInfo(gameName, tagLine, region);

      // Get summoner info to get profile icon and level
      const summonerInfo = await getSummonerInfo(riotAccountInfo.puuid, region);

      // Get rank info from Riot API
      const rankInfo = await getRiotRankInfo(riotAccountInfo.puuid, region);

      // Get latest ranked solo/duo game ID
      let latestGameId = null;
      try {
        const matchIds = await getRankedSoloDuoMatchHistory(riotAccountInfo.puuid, region, 1);
        if (matchIds.length > 0) {
          latestGameId = matchIds[0];
        }
      } catch (matchError) {
        console.warn('Could not fetch latest game ID:', matchError.message);
        // Continue without latest game ID - it will be set on first refresh
      }

      // Prepare Riot data for the shared account
      const riotData = {
        puuid: riotAccountInfo.puuid,
        summonerIcon: summonerInfo.profileIconId || 0,
        summonerLevel: summonerInfo.summonerLevel || 1,
        tier: rankInfo.tier || null,
        division: rankInfo.division || null,
        lp: rankInfo.lp || 0,
        lastSoloDuoGameId: latestGameId || 'NO_GAMES_YET'
      };

      // Find or create the shared league account
      const leagueAccount = await LeagueAccount.findOrCreateByRiotId(
        gameName, 
        tagLine, 
        region, 
        riotData
      );

      // Create user's relationship to this account
      const userLeagueAccount = new UserLeagueAccount({
        userId: user._id,
        leagueAccountId: leagueAccount._id,
        remainingDecayDays: Number(remainingDecayDays),
        isSpecial: isSpecial === true || isSpecial === 'true' || isSpecial === 'on',
        isDecaying: isDecaying === true || isDecaying === 'true' || isDecaying === 'on'
      });

      // Set Emerald accounts to immune immediately
      if (leagueAccount.tier === 'EMERALD') {
        userLeagueAccount.remainingDecayDays = -1;
        console.log(`🛡️  ${leagueAccount.riotId} is Emerald - setting immunity (decay days: -1)`);
      }

      await userLeagueAccount.save();

      // Process match history for the new account to ensure accurate decay tracking
      let matchHistoryResult = null;
      try {
        matchHistoryResult = await processAccountMatchHistory(leagueAccount, userLeagueAccount);
      } catch (matchError) {
        console.warn('Could not process match history for new account:', matchError.message);
        // Continue without match history processing
      }

      // Populate the league account data for the response
      const populatedUserAccount = await UserLeagueAccount.findById(userLeagueAccount._id)
        .populate('leagueAccountId');

      // Transform to flattened account shape
      const newLeagueAccount = populatedUserAccount.leagueAccountId;
      const account = {
        _id: populatedUserAccount._id,
        userId: populatedUserAccount.userId,
        puuid: newLeagueAccount.puuid,
        gameName: newLeagueAccount.gameName,
        tagLine: newLeagueAccount.tagLine,
        region: newLeagueAccount.region,
        summonerIcon: newLeagueAccount.summonerIcon,
        summonerLevel: newLeagueAccount.summonerLevel,
        tier: newLeagueAccount.tier,
        division: newLeagueAccount.division,
        lp: newLeagueAccount.lp,
        lastSoloDuoGameId: newLeagueAccount.lastSoloDuoGameId,
        remainingDecayDays: populatedUserAccount.remainingDecayDays,
        isActive: populatedUserAccount.isActive,
        isDecaying: populatedUserAccount.isDecaying,
        isSpecial: populatedUserAccount.isSpecial,
        lastUpdated: populatedUserAccount.leagueAccountId.lastUpdated,
        createdAt: populatedUserAccount.createdAt,
        // Add virtuals
        riotId: newLeagueAccount.riotId,
        rankDisplay: newLeagueAccount.rankDisplay,
        decayStatus: populatedUserAccount.decayStatus
      };

      res.status(201).json({
        success: true,
        data: account,
        matchHistory: matchHistoryResult,
        message: 'League account added successfully'
      });

    } catch (riotError) {
      console.error('Riot API error:', riotError);
      res.status(400).json({
        success: false,
        error: 'Invalid League account',
        message: 'Could not find this League account. Please check the game name, tag line, and region.'
      });
    }

  } catch (error) {
    console.error('Error adding league account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add league account',
      message: error.message
    });
  }
});

// Update league account
router.put('/:id', [
  authenticateToken,
  param('id').isMongoId().withMessage('Invalid account ID'),
  body('isActive').optional().isBoolean(),
  body('gameName').optional().isString().trim().isLength({ min: 1, max: 50 }),
  body('tagLine').optional().isString().trim().isLength({ min: 1, max: 10 }),
  body('remainingDecayDays').optional().isInt({ min: -1, max: 28 }).withMessage('Remaining decay days must be between -1 (immune) and 28'),
  body('isSpecial').optional().isBoolean().withMessage('isSpecial must be a boolean'),
  body('isDecaying').optional().isBoolean().withMessage('isDecaying must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const user = await User.findOne({ firebaseUid: req.user.sub });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userAccount = await UserLeagueAccount.findOne({
      _id: req.params.id,
      userId: user._id
    }).populate('leagueAccountId');

    if (!userAccount) {
      return res.status(404).json({
        success: false,
        error: 'League account not found'
      });
    }

    // Update allowed fields (only user-specific fields)
    const { isActive, remainingDecayDays, isSpecial, isDecaying } = req.body;
    if (typeof isActive === 'boolean') userAccount.isActive = isActive;
    if (typeof remainingDecayDays === 'number') userAccount.remainingDecayDays = remainingDecayDays;
    if (typeof isSpecial === 'boolean') userAccount.isSpecial = isSpecial;
    if (typeof isDecaying === 'boolean') userAccount.isDecaying = isDecaying;

    // Set Emerald accounts to immune
    if (userAccount.leagueAccountId.tier === 'EMERALD') {
      userAccount.remainingDecayDays = -1;
      console.log(`🛡️  ${userAccount.leagueAccountId.riotId} is Emerald - setting immunity (decay days: -1)`);
    }

    await userAccount.save();

    // Transform the data to match the expected format
    const account = {
      _id: userAccount._id,
      userId: userAccount.userId,
      puuid: userAccount.leagueAccountId.puuid,
      gameName: userAccount.leagueAccountId.gameName,
      tagLine: userAccount.leagueAccountId.tagLine,
      region: userAccount.leagueAccountId.region,
      summonerIcon: userAccount.leagueAccountId.summonerIcon,
      summonerLevel: userAccount.leagueAccountId.summonerLevel,
      tier: userAccount.leagueAccountId.tier,
      division: userAccount.leagueAccountId.division,
      lp: userAccount.leagueAccountId.lp,
      lastSoloDuoGameId: userAccount.leagueAccountId.lastSoloDuoGameId,
      remainingDecayDays: userAccount.remainingDecayDays,
      isActive: userAccount.isActive,
      isDecaying: userAccount.isDecaying,
      isSpecial: userAccount.isSpecial,
      lastUpdated: userAccount.leagueAccountId.lastUpdated,
      createdAt: userAccount.createdAt,
      // Add virtuals
      riotId: userAccount.leagueAccountId.riotId,
      rankDisplay: userAccount.leagueAccountId.rankDisplay,
      decayStatus: userAccount.decayStatus
    };

    res.json({
      success: true,
      data: account,
      message: 'League account updated successfully'
    });

  } catch (error) {
    console.error('Error updating league account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update league account',
      message: error.message
    });
  }
});

// Delete league account
router.delete('/:id', [
  authenticateToken,
  param('id').isMongoId().withMessage('Invalid account ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const user = await User.findOne({ firebaseUid: req.user.sub });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userAccount = await UserLeagueAccount.findOne({
      _id: req.params.id,
      userId: user._id
    });

    if (!userAccount) {
      return res.status(404).json({
        success: false,
        error: 'League account not found'
      });
    }

    await UserLeagueAccount.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'League account deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting league account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete league account',
      message: error.message
    });
  }
});

// Refresh account data from Riot API
router.post('/:id/refresh', [
  authenticateToken,
  param('id').isMongoId().withMessage('Invalid account ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: errors.array()
      });
    }

    const user = await User.findOne({ firebaseUid: req.user.sub });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userAccount = await UserLeagueAccount.findOne({
      _id: req.params.id,
      userId: user._id
    }).populate('leagueAccountId');

    if (!userAccount) {
      return res.status(404).json({
        success: false,
        error: 'League account not found'
      });
    }

    // Refresh data from Riot API and process match history
    try {
      const result = await processAccountMatchHistory(userAccount.leagueAccountId, userAccount);
      
      // Transform the data to match the expected format
      const account = {
        _id: userAccount._id,
        userId: userAccount.userId,
        puuid: userAccount.leagueAccountId.puuid,
        gameName: userAccount.leagueAccountId.gameName,
        tagLine: userAccount.leagueAccountId.tagLine,
        region: userAccount.leagueAccountId.region,
        summonerIcon: userAccount.leagueAccountId.summonerIcon,
        summonerLevel: userAccount.leagueAccountId.summonerLevel,
        tier: userAccount.leagueAccountId.tier,
        division: userAccount.leagueAccountId.division,
        lp: userAccount.leagueAccountId.lp,
        lastSoloDuoGameId: userAccount.leagueAccountId.lastSoloDuoGameId,
        remainingDecayDays: userAccount.remainingDecayDays,
        isActive: userAccount.isActive,
        isDecaying: userAccount.isDecaying,
        isSpecial: userAccount.isSpecial,
        lastUpdated: userAccount.leagueAccountId.lastUpdated,
        createdAt: userAccount.createdAt,
        // Add virtuals
        riotId: userAccount.leagueAccountId.riotId,
        rankDisplay: userAccount.leagueAccountId.rankDisplay,
        decayStatus: userAccount.decayStatus
      };
      
      res.json({
        success: true,
        data: account,
        matchHistory: result,
        message: result.updated ? 'Account data refreshed and match history processed' : 'Account data refreshed successfully'
      });

    } catch (riotError) {
      console.error('Riot API error during refresh:', riotError);
      res.status(400).json({
        success: false,
        error: 'Failed to refresh account data',
        message: 'Could not fetch updated data from Riot Games API'
      });
    }

  } catch (error) {
    console.error('Error refreshing league account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh league account',
      message: error.message
    });
  }
});

// Process decay for all diamond+ accounts
router.post('/decay/process', [
  authenticateApiKey
], async (req, res) => {
  try {
    const { region } = req.body;

    // 1. Find all LeagueAccount IDs in the region and tier
    const leagueAccountQuery = {
      tier: { $in: ['DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'] },
      isActive: true
    };
    
    if (region) {
      leagueAccountQuery.region = region.toUpperCase();
      console.log(`🌍 Processing decay for region: ${region}`);
    } else {
      console.log('🌍 Processing decay for all regions');
    }
    
    const leagueAccounts = await LeagueAccount.find(leagueAccountQuery).select('_id');
    const leagueAccountIds = leagueAccounts.map(acc => acc._id);

    // 2. Find all UserLeagueAccounts linked to those LeagueAccounts
    const userAccountQuery = {
      leagueAccountId: { $in: leagueAccountIds },
      isActive: true
    };
    
    const diamondPlusUserAccounts = await UserLeagueAccount.find(userAccountQuery).populate('leagueAccountId');

    if (diamondPlusUserAccounts.length === 0) {
      const regionMessage = region ? ` for region ${region}` : '';
      return res.json({
        success: true,
        message: `No diamond+ accounts found to process decay${regionMessage}`,
        data: {
          processed: 0,
          accounts: [],
          region: region || 'all'
        }
      });
    }

    const processedAccounts = [];
    const errors = [];

    // Process each account
    for (const userAccount of diamondPlusUserAccounts) {
      const account = userAccount.leagueAccountId;
      try {
        // Skip accounts that are immune (decay days = -1)
        if (userAccount.remainingDecayDays === -1) {
          console.log(`🛡️  ${account.riotId} is immune to decay (decay days: -1) - skipping`);
          continue;
        }
        
        if (userAccount.remainingDecayDays > 0) {
          // Account still has decay days - reduce by 1
          userAccount.remainingDecayDays -= 1;
          
          // Set isDecaying flag if account reaches 0 decay days
          if (userAccount.remainingDecayDays === 0) {
            userAccount.isDecaying = true;
            console.log(`🔄 ${account.riotId} has 0 decay days left - setting isDecaying flag`);
          }
          
          await userAccount.save();
          
          processedAccounts.push({
            id: userAccount._id,
            riotId: account.riotId,
            tier: account.tier,
            division: account.division,
            previousDecayDays: userAccount.remainingDecayDays + 1,
            currentDecayDays: userAccount.remainingDecayDays,
            isDecaying: userAccount.isDecaying
          });
        } else if (userAccount.remainingDecayDays === 0 && !userAccount.isDecaying) {
          // Account has 0 decay days but flag not set - set it now
          userAccount.isDecaying = true;
          await userAccount.save();
          
          console.log(`🔄 ${account.riotId} already has 0 decay days - setting isDecaying flag`);
          
          processedAccounts.push({
            id: userAccount._id,
            riotId: account.riotId,
            tier: account.tier,
            division: account.division,
            previousDecayDays: 0,
            currentDecayDays: 0,
            isDecaying: true,
            alreadyDecaying: true
          });
        } else if (userAccount.remainingDecayDays === 0 && userAccount.isDecaying) {
          // Account has 0 decay days and isDecaying flag is set
          // Check if Master+ account with LP < 75 should reset to 28 days
          if ((account.tier === 'MASTER' || account.tier === 'GRANDMASTER' || account.tier === 'CHALLENGER') && 
              account.lp < 75) {
            
            const previousDecayDays = userAccount.remainingDecayDays;
            userAccount.remainingDecayDays = 28;
            userAccount.isDecaying = false;
            userAccount.isSpecial = true; // Set special flag for this decay case
            
            await userAccount.save();
            
            console.log(`🔄 ${account.riotId} (${account.tier} ${account.lp}LP) decayed back to Diamond - reset to 28 days, set isSpecial flag`);
            
            processedAccounts.push({
              id: userAccount._id,
              riotId: account.riotId,
              tier: account.tier,
              division: account.division,
              previousDecayDays: previousDecayDays,
              currentDecayDays: 28,
              isDecaying: false,
              isSpecial: true,
              decayReset: true,
              reason: 'Master+ account decayed back to Diamond'
            });
          }
          // If not Master+ or LP >= 75, skip processing (already decaying)
        }
      } catch (accountError) {
        console.error(`Error processing decay for account ${userAccount._id}:`, accountError);
        errors.push({
          accountId: userAccount._id,
          riotId: account.riotId,
          error: accountError.message
        });
      }
    }

    const regionMessage = region ? ` for region ${region}` : '';
    res.json({
      success: true,
      message: `Decay processed for ${processedAccounts.length} accounts${regionMessage}`,
      data: {
        processed: processedAccounts.length,
        totalFound: diamondPlusUserAccounts.length,
        region: region || 'all',
        accounts: processedAccounts,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('Error processing decay:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process decay',
      message: error.message
    });
  }
});

// Check match history and update decay days for all accounts
router.post('/decay/check-matches', [
  authenticateApiKey
], async (req, res) => {
  try {
    console.log('🔄 Starting match history check for all user accounts...');
    
    // Find all UserLeagueAccount documents that are active
    const userAccounts = await UserLeagueAccount.find({ isActive: true })
      .populate('leagueAccountId');

    if (userAccounts.length === 0) {
      return res.json({
        success: true,
        message: 'No active user league accounts found to check',
        data: {
          processed: 0,
          accounts: []
        }
      });
    }

    console.log(`Found ${userAccounts.length} active user accounts to process`);
    
    const processedAccounts = [];
    const errors = [];

    // Process each UserLeagueAccount individually
    for (const userAccount of userAccounts) {
      try {
        const leagueAccount = userAccount.leagueAccountId;
        
        if (!leagueAccount) {
          console.warn(`⚠️  UserLeagueAccount ${userAccount._id} has no associated LeagueAccount`);
          continue;
        }

        console.log(`🔄 Processing: ${leagueAccount.riotId} (${leagueAccount.tier}${leagueAccount.division || ''})`);

        // Call processAccountMatchHistory with BOTH parameters for proper decay logic
        const result = await processAccountMatchHistory(leagueAccount, userAccount);

        // Add to processed accounts list
        processedAccounts.push({
          id: userAccount._id,
          riotId: leagueAccount.riotId,
          tier: leagueAccount.tier,
          division: leagueAccount.division,
          gamesPlayed: result.gamesPlayed || 0,
          previousDecayDays: result.previousDecayDays || userAccount.remainingDecayDays,
          currentDecayDays: userAccount.remainingDecayDays,
          decayDaysAdded: result.decayDaysAdded || 0,
          latestGameId: result.latestGameId || leagueAccount.lastSoloDuoGameId,
          updated: result.updated || false,
          isDecaying: userAccount.isDecaying,
          isSpecial: userAccount.isSpecial,
          rankUpdated: result.rankUpdated || false
        });

        console.log(`   ✅ ${leagueAccount.riotId} processed - Games: ${result.gamesPlayed || 0}, Decay: ${userAccount.remainingDecayDays}`);

      } catch (accountError) {
        console.error(`   ❌ Error processing user account ${userAccount._id}:`, accountError.message);
        
        const leagueAccount = userAccount.leagueAccountId;
        errors.push({
          userAccountId: userAccount._id,
          leagueAccountId: leagueAccount?._id,
          riotId: leagueAccount?.riotId || 'Unknown',
          error: accountError.message
        });
      }
    }

    console.log(`🎉 Match history check completed - Processed: ${processedAccounts.length}, Errors: ${errors.length}`);

    res.json({
      success: true,
      message: `Match history check completed for ${processedAccounts.length} user accounts`,
      data: {
        processed: processedAccounts.length,
        totalFound: userAccounts.length,
        accounts: processedAccounts,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('Error checking match history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check match history',
      message: error.message
    });
  }
});

// Test endpoint to verify Firebase configuration
router.get('/test-firebase', async (req, res) => {
  try {
    // Check if Firebase environment variables are set
    const requiredVars = [
      'FIREBASE_TYPE',
      'FIREBASE_PROJECT_ID', 
      'FIREBASE_PRIVATE_KEY_ID',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_CLIENT_ID'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      return res.status(500).json({
        success: false,
        error: 'Missing Firebase environment variables',
        missing: missingVars
      });
    }
    
    // Test Firebase connection
    const auth = (await import('../config/firebase.js')).auth;
    
    res.json({
      success: true,
      message: 'Firebase configuration is valid',
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    });
    
  } catch (error) {
    console.error('Firebase test error:', error);
    res.status(500).json({
      success: false,
      error: 'Firebase configuration error',
      message: error.message
    });
  }
});

export default router; 
