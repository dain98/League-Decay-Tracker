import mongoose from 'mongoose';

const leagueAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  puuid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  summonerIcon: {
    type: Number,
    default: 0
  },
  gameName: {
    type: String,
    required: true,
    trim: true
  },
  tagLine: {
    type: String,
    required: true,
    trim: true
  },
  region: {
    type: String,
    required: true,
    enum: ['NA1', 'EUN1', 'EUW1', 'KR', 'BR1', 'LA1', 'LA2', 'OC1', 'TR1', 'RU', 'JP1', 'PH2', 'SG2', 'TH2', 'VN2', 'TW2'],
    uppercase: true,
    index: true
  },
  remainingDecayDays: {
    type: Number,
    default: 28,
    min: 0,
    max: 28,
    index: true
  },
  division: {
    type: String,
    enum: ['I', 'II', 'III', 'IV'],
    default: null
  },
  tier: {
    type: String,
    enum: ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'],
    default: null
  },
  lp: {
    type: Number,
    default: 0,
    min: 0
  },
  lastSoloDuoGameId: {
    type: String,
    required: true
  },
  summonerLevel: {
    type: Number,
    default: 1,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
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

// Virtual for full riot ID
leagueAccountSchema.virtual('riotId').get(function() {
  return `${this.gameName}#${this.tagLine}`;
});

// Virtual for full rank display
leagueAccountSchema.virtual('rankDisplay').get(function() {
  if (!this.tier) return 'Unranked';
  if (this.tier === 'MASTER' || this.tier === 'GRANDMASTER' || this.tier === 'CHALLENGER') {
    return this.tier;
  }
  return `${this.tier} ${this.division}`;
});

// Virtual for decay status
leagueAccountSchema.virtual('decayStatus').get(function() {
  if (this.remainingDecayDays <= 0) return 'EXPIRED';
  if (this.remainingDecayDays <= 3) return 'CRITICAL';
  if (this.remainingDecayDays <= 7) return 'WARNING';
  return 'SAFE';
});

// Compound index for user's accounts
leagueAccountSchema.index({ userId: 1, isActive: 1 });

// Pre-save middleware to update lastUpdated
leagueAccountSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Static method to find user's accounts
leagueAccountSchema.statics.findByUserId = async function(userId, options = {}) {
  const query = { userId, isActive: true };
  
  if (options.includeInactive) {
    delete query.isActive;
  }
  
  return this.find(query)
    .sort({ lastUpdated: -1 })
    .populate('userId', 'name email');
};

// Static method to find account by puuid
leagueAccountSchema.statics.findByPuuid = async function(puuid) {
  return this.findOne({ puuid }).populate('userId', 'name email');
};

// Instance method to update decay information
leagueAccountSchema.methods.updateDecayInfo = async function(decayDays, lastGameId = null, lastGameDate = null) {
  this.remainingDecayDays = decayDays;
  if (lastGameId) this.lastSoloDuoGameId = lastGameId;
  if (lastGameDate) this.lastSoloDuoGameDate = lastGameDate;
  this.lastUpdated = new Date();
  return this.save();
};

// Instance method to update rank information
leagueAccountSchema.methods.updateRankInfo = async function(tier, division, lp) {
  this.tier = tier;
  this.division = division;
  this.lp = lp;
  this.lastUpdated = new Date();
  return this.save();
};

const LeagueAccount = mongoose.model('LeagueAccount', leagueAccountSchema);

export default LeagueAccount; 
 