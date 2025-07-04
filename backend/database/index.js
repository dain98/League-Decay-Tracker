// Database exports
export { default as connectDB, testConnection } from './connection.js';
export { default as User } from './models/User.js';
export { default as LeagueAccount } from './models/LeagueAccount.js';
export { default as UserLeagueAccount } from './models/UserLeagueAccount.js';

// Database utilities
export const dbStatus = {
  isConnected: async () => {
    const mongoose = await import('mongoose');
    return mongoose.connection.readyState === 1;
  },
  
  getConnectionState: async () => {
    const mongoose = await import('mongoose');
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    return states[mongoose.connection.readyState] || 'unknown';
  }
}; 
