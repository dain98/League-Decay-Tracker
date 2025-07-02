import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.DECAY_API_KEY;

// API Key authentication middleware
export const authenticateApiKey = (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({ 
        error: 'API key required',
        message: 'No API key provided. Use X-API-Key header or Authorization: Bearer <key>'
      });
    }
    
    if (!API_KEY) {
      console.error('DECAY_API_KEY environment variable not set');
      return res.status(500).json({ 
        error: 'Server configuration error',
        message: 'API key authentication not properly configured'
      });
    }
    
    if (apiKey !== API_KEY) {
      return res.status(401).json({ 
        error: 'Invalid API key',
        message: 'The provided API key is invalid'
      });
    }
    
    // Add a flag to indicate this is an API key authenticated request
    req.isApiKeyAuth = true;
    
    next();
  } catch (error) {
    console.error('API key authentication error:', error);
    return res.status(500).json({ 
      error: 'Authentication error',
      message: 'Failed to authenticate API key'
    });
  }
};

// Optional API key authentication (doesn't fail if no key)
export const optionalApiKey = (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (apiKey && API_KEY && apiKey === API_KEY) {
      req.isApiKeyAuth = true;
    }
    
    next();
  } catch (error) {
    console.warn('Optional API key auth failed:', error.message);
    next();
  }
}; 
