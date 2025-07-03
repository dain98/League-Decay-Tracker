import dotenv from 'dotenv';
import { auth } from '../config/firebase.js';

dotenv.config();

// Verify Firebase ID token
const verifyToken = async (token) => {
  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

// Get user profile from Firebase
const getUserProfileFromFirebase = async (uid) => {
  try {
    const userRecord = await auth.getUser(uid);
    return {
      sub: userRecord.uid,
      email: userRecord.email,
      name: userRecord.displayName || userRecord.email,
      picture: userRecord.photoURL,
      email_verified: userRecord.emailVerified,
      nickname: userRecord.displayName
    };
  } catch (error) {
    throw new Error(`Failed to get user profile: ${error.message}`);
  }
};

// Firebase middleware
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        message: 'No authorization token provided'
      });
    }
    
    // Verify the Firebase token
    const decodedToken = await verifyToken(token);

    // Get user profile from Firebase
    const userProfile = await getUserProfileFromFirebase(decodedToken.uid);
    
    // Debug logging
    console.log('User profile from Firebase:', userProfile);

    // Add user info to request
    req.user = userProfile;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      error: 'Invalid token',
      message: error.message
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      const decodedToken = await verifyToken(token);
      const userProfile = await getUserProfileFromFirebase(decodedToken.uid);
      req.user = userProfile;
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    console.warn('Optional auth failed:', error.message);
    next();
  }
};

// Role-based authorization middleware
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'User must be authenticated'
      });
    }
    
    // Check if user has the required role
    // You can extend this to check custom claims from Firebase
    if (req.user.role !== role) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `Role '${role}' required`
      });
    }
    
    next();
  };
}; 
