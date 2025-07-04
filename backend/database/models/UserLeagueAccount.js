import mongoose from 'mongoose';

const userLeagueAccountSchema = new mongoose.Schema({
  // Reference to user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  // Reference to shared league account
  leagueAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LeagueAccount',
    required: true,
    index: true
  },
  // User-specific decay tracking
  remainingDecayDays: {
    type: Number,
    default: 28,
    min: -1,
    max: 28,
    index: true
  },
  // User-specific flags
  isDecaying: {
    type: Boolean,
    default: false,
    index: true
  },
  isSpecial: {
    type: Boolean,
    default: false,
    index: true
  },
  // User-specific settings
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  // Tracking
  lastUpdated: {
    type: Date,
    default: Date.now,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for decay status
userLeagueAccountSchema.virtual('decayStatus').get(function() {
  if (this.remainingDecayDays <= 0) return 'EXPIRED';
  if (this.remainingDecayDays <= 3) return 'CRITICAL';
  if (this.remainingDecayDays <= 7) return 'WARNING';
  return 'SAFE';
});

// Compound indexes
userLeagueAccountSchema.index({ userId: 1, leagueAccountId: 1 }, { unique: true });
userLeagueAccountSchema.index({ userId: 1, isActive: 1 });

// Pre-save middleware to update lastUpdated
userLeagueAccountSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Static method to find user's accounts with populated league account data
userLeagueAccountSchema.statics.findByUserId = async function(userId, options = {}) {
  const query = { userId, isActive: true };
  
  if (options.includeInactive) {
    delete query.isActive;
  }
  
  console.log('findByUserId query:', query);
  const result = await this.find(query)
    .populate('leagueAccountId')
    .sort({ lastUpdated: -1 });
  console.log('findByUserId result:', result);
  return result;
};

// Static method to find user's account by league account ID
userLeagueAccountSchema.statics.findByUserAndLeagueAccount = async function(userId, leagueAccountId) {
  return this.findOne({ userId, leagueAccountId }).populate('leagueAccountId');
};

// Static method to check if user already has this account
userLeagueAccountSchema.statics.userHasAccount = async function(userId, leagueAccountId) {
  const existing = await this.findOne({ userId, leagueAccountId });
  return !!existing;
};

// Instance method to update decay information
userLeagueAccountSchema.methods.updateDecayInfo = async function(decayDays) {
  this.remainingDecayDays = decayDays;
  this.isDecaying = decayDays <= 0;
  this.lastUpdated = new Date();
  return this.save();
};

// Instance method to update user-specific settings
userLeagueAccountSchema.methods.updateSettings = async function(settings) {
  if (settings.hasOwnProperty('isActive')) this.isActive = settings.isActive;
  if (settings.hasOwnProperty('isSpecial')) this.isSpecial = settings.isSpecial;
  if (settings.hasOwnProperty('remainingDecayDays')) {
    this.remainingDecayDays = settings.remainingDecayDays;
    this.isDecaying = settings.remainingDecayDays <= 0;
  }
  this.lastUpdated = new Date();
  return this.save();
};

const UserLeagueAccount = mongoose.model('UserLeagueAccount', userLeagueAccountSchema);

export default UserLeagueAccount; 
