import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { User, LeagueAccount } from '../database/index.js';
import axios from 'axios';

const router = express.Router();

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Find or create user from Auth0 data
    const user = await User.findOrCreateFromAuth0(req.user, req.query.fallbackName);
    
    res.json({
      success: true,
      data: {
        id: user._id,
        auth0Id: user.auth0Id,
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
    if (error.message === 'DUPLICATE_EMAIL') {
      return res.status(400).json({
        success: false,
        error: 'DUPLICATE_EMAIL',
        message: 'An account with this email already exists. Please log in using your original provider.'
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
    const user = await User.findOne({ auth0Id: req.user.sub });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update allowed fields
    const { name, nickname, picture, email } = req.body;
    if (name) user.name = name;
    if (nickname) user.nickname = nickname;
    if (picture) user.picture = picture;
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'Email already in use',
          message: 'This email address is already associated with another account.'
        });
      }
      user.email = email;
    }

    await user.save();

    res.json({
      success: true,
      data: {
        id: user._id,
        auth0Id: user.auth0Id,
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
    console.log('Fallback name param:', req.query.fallbackName);
    const user = await User.findOrCreateFromAuth0(req.user, req.query.fallbackName);
    // Get user's league accounts with population
    const accounts = await user.populate('leagueAccounts');
    res.json({
      success: true,
      data: accounts.leagueAccounts || []
    });
  } catch (error) {
    if (error.message === 'DUPLICATE_EMAIL') {
      return res.status(400).json({
        success: false,
        error: 'DUPLICATE_EMAIL',
        message: 'An account with this email already exists. Please log in using your original provider.'
      });
    }
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
    const user = await User.findOne({ auth0Id: req.user.sub });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user's league accounts
    const accounts = await user.populate('leagueAccounts');
    const leagueAccounts = accounts.leagueAccounts || [];

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

// Delete user account (hard delete, cascade league accounts, delete Auth0 user)
router.delete('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ auth0Id: req.user.sub });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // 1. Delete all league accounts for this user
    await LeagueAccount.deleteMany({ userId: user._id });

    // 2. Delete the user document
    await user.deleteOne();

    // 3. Delete the Auth0 user via Management API
    try {
      // Get Auth0 Management API token
      const tokenResponse = await axios.post(
        `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
        {
          client_id: process.env.AUTH0_MGMT_CLIENT_ID,
          client_secret: process.env.AUTH0_MGMT_CLIENT_SECRET,
          audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
          grant_type: 'client_credentials'
        },
        { headers: { 'content-type': 'application/json' } }
      );
      const mgmtToken = tokenResponse.data.access_token;
      // Delete Auth0 user
      await axios.delete(
        `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(user.auth0Id)}`,
        { headers: { Authorization: `Bearer ${mgmtToken}` } }
      );
    } catch (auth0Err) {
      console.error('Error deleting Auth0 user:', auth0Err.response?.data || auth0Err.message);
      // Still return success for local deletion, but include Auth0 error
      return res.status(200).json({
        success: true,
        message: 'User and league accounts deleted locally, but failed to delete Auth0 user.',
        auth0Error: auth0Err.response?.data || auth0Err.message
      });
    }

    res.json({
      success: true,
      message: 'User, league accounts, and Auth0 account deleted.'
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
