import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { User, LeagueAccount } from '../database/index.js';
import { getRiotAccountInfo, getSummonerInfo, getRiotRankInfo } from '../services/riotApi.js';

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

    res.json({
      success: true,
      data: account
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
        remainingDecayDays: Number(remainingDecayDays)
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

export default router; 
