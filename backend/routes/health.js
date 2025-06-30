import express from 'express';
import { testConnection } from '../database/index.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'running',
        database: dbStatus ? 'connected' : 'disconnected'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'running',
        database: 'error'
      },
      error: error.message
    });
  }
});

router.get('/detailed', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: 'running',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.version
        },
        database: {
          status: dbStatus ? 'connected' : 'disconnected',
          connection: dbStatus ? 'active' : 'failed'
        }
      },
      environment: {
        node_env: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 5000,
        cors_origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      services: {
        api: 'running',
        database: 'error'
      }
    });
  }
});

export default router; 
