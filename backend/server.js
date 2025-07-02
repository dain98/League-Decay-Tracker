import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import database connection
import { connectDB } from './database/index.js';

// Import routes
import userRoutes from './routes/users.js';
import accountRoutes from './routes/accounts.js';
import healthRoutes from './routes/health.js';

// Import cron manager
import CronManager from './cron/cronManager.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'https://f169-108-53-147-205.ngrok-free.app',
      'https://loldecay.up.railway.app',
      'https://loldecay-backend.up.railway.app'
    ];
    
    // Add environment variable origins if they exist
    if (process.env.CORS_ORIGIN) {
      const envOrigins = process.env.CORS_ORIGIN.split(',').map(origin => origin.trim());
      allowedOrigins.push(...envOrigins);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    message: 'Rate limit exceeded'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'League Decay Tracker API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/health', healthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/accounts', accountRoutes);

// Manual cron trigger endpoints (for testing)
app.post('/api/cron/trigger-decay', async (req, res) => {
  try {
    if (!app.locals.cronManager) {
      return res.status(503).json({ error: 'Cron manager not available' });
    }
    
    await app.locals.cronManager.triggerDecay();
    res.json({ message: 'Decay processing triggered successfully' });
  } catch (error) {
    console.error('Error triggering decay:', error);
    res.status(500).json({ error: 'Failed to trigger decay processing' });
  }
});

app.post('/api/cron/trigger-match-history', async (req, res) => {
  try {
    if (!app.locals.cronManager) {
      return res.status(503).json({ error: 'Cron manager not available' });
    }
    
    await app.locals.cronManager.triggerMatchHistory();
    res.json({ message: 'Match history check triggered successfully' });
  } catch (error) {
    console.error('Error triggering match history:', error);
    res.status(500).json({ error: 'Failed to trigger match history check' });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  // Default error
  let statusCode = 500;
  let message = 'Internal Server Error';
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry';
  } else if (err.status) {
    statusCode = err.status;
    message = err.message;
  }
  
  res.status(statusCode).json({
    error: message,
    message: err.message || 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
    });

    // Start cron jobs (only in production or when explicitly enabled)
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_CRON === 'true') {
      const cronManager = new CronManager();
      cronManager.start();
      
      // Store cron manager instance for potential manual triggers
      app.locals.cronManager = cronManager;
      
      console.log('⏰ Cron jobs started');
    } else {
      console.log('⏰ Cron jobs disabled (set ENABLE_CRON=true to enable)');
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer(); 
