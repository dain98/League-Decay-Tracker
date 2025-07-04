import mongoose from 'mongoose';

const leagueAccountSchema = new mongoose.Schema({
  // Riot API unique identifier - this makes each account unique globally
  puuid: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // Riot ID components
  gameName: {
    type: String,
    required: true,
    trim: true,
    index: true
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
  // Riot API data (same for all users)
  summonerIcon: {
    type: Number,
    default: 0
  },
  summonerLevel: {
    type: Number,
    default: 1,
    min: 1
  },
  tier: {
    type: String,
    enum: ['IRON', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'EMERALD', 'DIAMOND', 'MASTER', 'GRANDMASTER', 'CHALLENGER'],
    default: null
  },
  division: {
    type: String,
    enum: ['I', 'II', 'III', 'IV'],
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
  // Shared tracking data
  isActive: {
    type: Boolean,
    default: true,
    index: true
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

// Compound index for region and game name
leagueAccountSchema.index({ region: 1, gameName: 1, tagLine: 1 }, { unique: true });

// Pre-save middleware to update lastUpdated
leagueAccountSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Static method to find or create account by Riot ID
leagueAccountSchema.statics.findOrCreateByRiotId = async function(gameName, tagLine, region, riotData = {}) {
  const existingAccount = await this.findOne({
    region: region.toUpperCase(),
    gameName: gameName,
    tagLine: tagLine
  });

  if (existingAccount) {
    // Update with latest data from Riot API
    Object.assign(existingAccount, riotData);
    await existingAccount.save();
    return existingAccount;
  }

  // Create new account
  const newAccount = new this({
    puuid: riotData.puuid,
    gameName: gameName,
    tagLine: tagLine,
    region: region.toUpperCase(),
    summonerIcon: riotData.summonerIcon || 0,
    summonerLevel: riotData.summonerLevel || 1,
    tier: riotData.tier || null,
    division: riotData.division || null,
    lp: riotData.lp || 0,
    lastSoloDuoGameId: riotData.lastSoloDuoGameId || 'NO_GAMES_YET'
  });

  return await newAccount.save();
};

// Instance method to update rank information
leagueAccountSchema.methods.updateRankInfo = async function(tier, division, lp) {
  this.tier = tier;
  this.division = division;
  this.lp = lp;
  this.lastUpdated = new Date();
  return this.save();
};

// Instance method to update summoner info
leagueAccountSchema.methods.updateSummonerInfo = async function(summonerIcon, summonerLevel) {
  this.summonerIcon = summonerIcon;
  this.summonerLevel = summonerLevel;
  this.lastUpdated = new Date();
  return this.save();
};

const LeagueAccount = mongoose.model('LeagueAccount', leagueAccountSchema);

export default LeagueAccount; 
 