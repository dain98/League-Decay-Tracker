import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { authenticateApiKey } from '../middleware/apiKey.js';
import { User, LeagueAccount } from '../database/index.js';
import { getRiotAccountInfo, getSummonerInfo, getRiotRankInfo, getRankedSoloDuoMatchHistory, processAccountMatchHistory } from '../services/riotApi.js';

const router = express.Router();

// Get all league accounts for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ auth0Id: req.user.sub });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const accounts = await LeagueAccount.findByUserId(user._id);
    
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

    const user = await User.findOne({ auth0Id: req.user.sub });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const account = await LeagueAccount.findOne({
      _id: req.params.id,
      userId: user._id
    }).populate('userId', 'name email');

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'League account not found'
      });
    }

    // Process match history and update decay if needed
    let matchHistoryResult = null;
    try {
      matchHistoryResult = await processAccountMatchHistory(account);
    } catch (matchError) {
      console.warn('Could not process match history for account:', matchError.message);
      // Continue without match history processing
    }

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
  body('region').isIn(['NA1', 'EUN1', 'EUW1', 'KR', 'BR1', 'LA1', 'LA2', 'OC1', 'TR1', 'RU', 'JP1', 'PH2', 'SG2', 'TH2', 'VN2', 'TW2']).withMessage('Invalid region'),
  body('remainingDecayDays').isInt({ min: 0, max: 28 }).withMessage('Remaining decay days must be between 0 and 28')
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

    const user = await User.findOne({ auth0Id: req.user.sub });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const { gameName, tagLine, region, remainingDecayDays } = req.body;

    // Check if account already exists for this user
    const existingAccount = await LeagueAccount.findOne({
      userId: user._id,
      gameName: gameName,
      tagLine: tagLine,
      region: region
    });

    if (existingAccount) {
      return res.status(409).json({
        success: false,
        error: 'Account already exists',
        message: 'This League account is already registered for your profile'
      });
    }

    // Get account info from Riot API
    try {
      const riotAccountInfo = await getRiotAccountInfo(gameName, tagLine, region);
      
      // Check if account already exists globally (different user)
      const globalExistingAccount = await LeagueAccount.findOne({
        puuid: riotAccountInfo.puuid
      });

      if (globalExistingAccount) {
        return res.status(409).json({
          success: false,
          error: 'Account already registered',
          message: 'This League account is already registered by another user'
        });
      }

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

      // Create new league account
      const newAccount = new LeagueAccount({
        userId: user._id,
        puuid: riotAccountInfo.puuid,
        summonerIcon: summonerInfo.profileIconId || 0,
        gameName: gameName,
        tagLine: tagLine,
        region: region,
        summonerLevel: summonerInfo.summonerLevel || 1,
        tier: rankInfo.tier || null,
        division: rankInfo.division || null,
        lp: rankInfo.lp || 0,
        remainingDecayDays: Number(remainingDecayDays),
        lastSoloDuoGameId: latestGameId || 'NO_GAMES_YET'
      });

      await newAccount.save();

      res.status(201).json({
        success: true,
        data: newAccount,
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
  body('tagLine').optional().isString().trim().isLength({ min: 1, max: 10 })
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

    const user = await User.findOne({ auth0Id: req.user.sub });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const account = await LeagueAccount.findOne({
      _id: req.params.id,
      userId: user._id
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'League account not found'
      });
    }

    // Update allowed fields
    const { isActive, gameName, tagLine } = req.body;
    if (typeof isActive === 'boolean') account.isActive = isActive;
    if (gameName) account.gameName = gameName;
    if (tagLine) account.tagLine = tagLine;

    await account.save();

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

    const user = await User.findOne({ auth0Id: req.user.sub });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const account = await LeagueAccount.findOne({
      _id: req.params.id,
      userId: user._id
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'League account not found'
      });
    }

    await LeagueAccount.findByIdAndDelete(req.params.id);

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

    const user = await User.findOne({ auth0Id: req.user.sub });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const account = await LeagueAccount.findOne({
      _id: req.params.id,
      userId: user._id
    });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'League account not found'
      });
    }

    // Refresh data from Riot API
    try {
      const riotAccountInfo = await getRiotAccountInfo(account.gameName, account.tagLine, account.region);
      const summonerInfo = await getSummonerInfo(account.puuid, account.region);
      const rankInfo = await getRiotRankInfo(account.puuid, account.region);

      // Update account with fresh data
      account.summonerIcon = summonerInfo.profileIconId || account.summonerIcon;
      account.summonerLevel = summonerInfo.summonerLevel || account.summonerLevel;
      account.tier = rankInfo.tier || account.tier;
      account.division = rankInfo.division || account.division;
      account.lp = rankInfo.lp || account.lp;
      account.lastUpdated = new Date();

      await account.save();

      res.json({
        success: true,
        data: account,
        message: 'Account data refreshed successfully'
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

    // Build query for diamond+ accounts
    const query = {
      tier: { $in: ['DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'] },
      isActive: true
    };

    // Add region filter if provided
    if (region) {
      query.region = region;
      console.log(`🌍 Processing decay for region: ${region}`);
    } else {
      console.log('🌍 Processing decay for all regions');
    }

    // Find all accounts that are diamond and above
    const diamondPlusAccounts = await LeagueAccount.find(query);

    if (diamondPlusAccounts.length === 0) {
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
    for (const account of diamondPlusAccounts) {
      try {
        // Skip accounts that are immune (decay days = -1)
        if (account.remainingDecayDays === -1) {
          console.log(`🛡️  ${account.riotId} is immune to decay (decay days: -1) - skipping`);
          continue;
        }
        
        if (account.remainingDecayDays > 0) {
          // Account still has decay days - reduce by 1
          account.remainingDecayDays -= 1;
          
          // Set isDecaying flag if account reaches 0 decay days
          if (account.remainingDecayDays === 0) {
            account.isDecaying = true;
            console.log(`🔄 ${account.riotId} has 0 decay days left - setting isDecaying flag`);
          }
          
          await account.save();
          
          processedAccounts.push({
            id: account._id,
            riotId: account.riotId,
            tier: account.tier,
            division: account.division,
            previousDecayDays: account.remainingDecayDays + 1,
            currentDecayDays: account.remainingDecayDays,
            isDecaying: account.isDecaying
          });
        } else if (account.remainingDecayDays === 0 && !account.isDecaying) {
          // Account has 0 decay days but flag not set - set it now
          account.isDecaying = true;
          await account.save();
          
          console.log(`🔄 ${account.riotId} already has 0 decay days - setting isDecaying flag`);
          
          processedAccounts.push({
            id: account._id,
            riotId: account.riotId,
            tier: account.tier,
            division: account.division,
            previousDecayDays: 0,
            currentDecayDays: 0,
            isDecaying: true,
            alreadyDecaying: true
          });
        } else if (account.remainingDecayDays === 0 && account.isDecaying) {
          // Account has 0 decay days and isDecaying flag is set
          // Check if Master+ account with LP < 75 should reset to 28 days
          if ((account.tier === 'MASTER' || account.tier === 'GRANDMASTER' || account.tier === 'CHALLENGER') && 
              account.lp < 75) {
            
            const previousDecayDays = account.remainingDecayDays;
            account.remainingDecayDays = 28;
            account.isDecaying = false;
            account.isSpecial = true; // Set special flag for this decay case
            
            await account.save();
            
            console.log(`🔄 ${account.riotId} (${account.tier} ${account.lp}LP) decayed back to Diamond - reset to 28 days, set isSpecial flag`);
            
            processedAccounts.push({
              id: account._id,
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
        console.error(`Error processing decay for account ${account._id}:`, accountError);
        errors.push({
          accountId: account._id,
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
        totalFound: diamondPlusAccounts.length,
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
    // Find all active accounts
    const allAccounts = await LeagueAccount.find({
      isActive: true
    });

    if (allAccounts.length === 0) {
      return res.json({
        success: true,
        message: 'No active accounts found to check',
        data: {
          processed: 0,
          accounts: []
        }
      });
    }

    const processedAccounts = [];
    const errors = [];

    // Process each account
    for (const account of allAccounts) {
      try {
        const result = await processAccountMatchHistory(account);
        
        if (result.updated) {
          processedAccounts.push({
            id: account._id,
            riotId: account.riotId,
            tier: account.tier,
            division: account.division,
            gamesPlayed: result.gamesPlayed,
            previousDecayDays: result.previousDecayDays,
            currentDecayDays: result.currentDecayDays,
            decayDaysAdded: result.decayDaysAdded,
            latestGameId: result.latestGameId
          });
        }

      } catch (accountError) {
        console.error(`   ❌ Error processing account ${account._id}:`, accountError.message);
        errors.push({
          accountId: account._id,
          riotId: account.riotId,
          error: accountError.message
        });
      }
    }

    res.json({
      success: true,
      message: `Match history check completed for ${processedAccounts.length} accounts`,
      data: {
        processed: processedAccounts.length,
        totalFound: allAccounts.length,
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

export default router; 
