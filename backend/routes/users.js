import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { User, LeagueAccount, UserLeagueAccount } from '../database/index.js';
import axios from 'axios';

const router = express.Router();

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    console.log('GET /me - req.user:', req.user);
    console.log('GET /me - req.query.fallbackName:', req.query.fallbackName);
    
    // Find or create user from Firebase data
    console.log('GET /me - Calling findOrCreateFromFirebase...');
    const user = await User.findOrCreateFromFirebase(req.user, req.query.fallbackName);
    
    console.log('GET /me - User created/found:', user);
    
    const responseData = {
      success: true,
      data: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        picture: user.picture,
        emailVerified: user.emailVerified,
        nickname: user.nickname,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    };
    
    console.log('GET /me - Sending response:', responseData);
    res.json(responseData);
  } catch (error) {
    console.error('GET /me - Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    if (error.message === 'DUPLICATE_EMAIL') {
      return res.status(400).json({
        success: false,
        error: 'DUPLICATE_EMAIL',
        message: 'An account with this email already exists. Please log in using your original provider.'
      });
    }
    
    if (error.message.includes('Missing Firebase user ID')) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_FIREBASE_DATA',
        message: 'Invalid Firebase user data received'
      });
    }
    
    console.error('Error getting user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile',
      message: error.message
    });
  }
});

// Update user profile
router.put('/me', [
  authenticateToken,
  body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('nickname').optional().isString().trim().isLength({ min: 1, max: 50 }),
  body('picture').optional().isURL(),
  body('email').optional().isEmail().normalizeEmail()
], async (req, res) => {
  try {
    // Sanitize picture: remove if undefined
    if (req.body.picture === undefined) {
      delete req.body.picture;
    }
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: errors.array()
      });
    }

    // Find user
    const user = await User.findOne({ firebaseUid: req.user.sub });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update allowed fields
    const { name, nickname, picture } = req.body;
    if (name) user.name = name;
    if (nickname) user.nickname = nickname;
    if (picture) user.picture = picture;

    await user.save();

    res.json({
      success: true,
      data: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        picture: user.picture,
        emailVerified: user.emailVerified,
        nickname: user.nickname,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user profile',
      message: error.message
    });
  }
});

// Get user's league accounts
router.get('/me/accounts', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.sub });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Use the new normalized structure
    const userAccounts = await UserLeagueAccount.findByUserId(user._id);

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
    console.error('Error getting user accounts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user accounts',
      message: error.message
    });
  }
});

// Get user statistics
router.get('/me/stats', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.sub });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's league accounts with populated league account data
    const userAccounts = await UserLeagueAccount.findByUserId(user._id);
    const leagueAccounts = userAccounts.map(userAccount => ({
      ...userAccount.toObject(),
      ...userAccount.leagueAccountId.toObject()
    }));

    // Calculate statistics
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

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user statistics',
      message: error.message
    });
  }
});

// Delete user account (hard delete, cascade league accounts)
router.delete('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.sub });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // 1. Delete all user league account relationships for this user
    await UserLeagueAccount.deleteMany({ userId: user._id });

    // 2. Delete the user document
    await user.deleteOne();

    res.json({
      success: true,
      message: 'User and league accounts deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user account',
      message: error.message
    });
  }
});

export default router; 
