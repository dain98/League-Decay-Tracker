import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import dotenv from 'dotenv';

dotenv.config();

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;

// JWKS client for token verification
const client = jwksClient({
  jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000, // 10 minutes
});

// Get signing key for token verification
const getSigningKey = (kid) => {
  return new Promise((resolve, reject) => {
    client.getSigningKey(kid, (err, key) => {
      if (err) {
        reject(err);
      } else {
        const signingKey = key.publicKey || key.rsaPublicKey;
        resolve(signingKey);
      }
    });
  });
};

// Verify JWT token
const verifyToken = async (token) => {
  try {
    const decoded = jwt.decode(token, { complete: true });
    
    if (!decoded) {
      throw new Error('Invalid token format');
    }
    
    const { header, payload } = decoded;
    
    // Verify token issuer
    if (payload.iss !== `https://${AUTH0_DOMAIN}/`) {
      throw new Error('Invalid token issuer');
    }
    
    // Verify token audience
    if (payload.aud !== AUTH0_AUDIENCE && !payload.aud.includes(AUTH0_AUDIENCE)) {
      throw new Error('Invalid token audience');
    }
    
    // Get signing key
    const signingKey = await getSigningKey(header.kid);
    
    // Verify token signature
    const verified = jwt.verify(token, signingKey, {
      algorithms: ['RS256'],
      issuer: `https://${AUTH0_DOMAIN}/`,
      audience: AUTH0_AUDIENCE,
    });
    
    return verified;
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

// Auth0 middleware
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
    
    // Verify the token
    const decoded = await verifyToken(token);
    
    // Add user info to request
    req.user = {
      sub: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
      email_verified: decoded.email_verified,
      nickname: decoded.nickname
    };
    
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
      const decoded = await verifyToken(token);
      req.user = {
        sub: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        email_verified: decoded.email_verified,
        nickname: decoded.nickname
      };
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
    // You can extend this to check custom claims or roles from Auth0
    if (req.user.role !== role) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `Role '${role}' required`
      });
    }
    
    next();
  };
}; 
