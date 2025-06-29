import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  auth0Id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  picture: {
    type: String,
    default: null
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  nickname: {
    type: String,
    trim: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
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

// Virtual for getting user's league accounts
userSchema.virtual('leagueAccounts', {
  ref: 'LeagueAccount',
  localField: '_id',
  foreignField: 'userId'
});

// Pre-save middleware to update the updatedAt field
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find or create user from Auth0 data
userSchema.statics.findOrCreateFromAuth0 = async function(auth0User) {
  try {
    let user = await this.findOne({ auth0Id: auth0User.sub });
    
    if (!user) {
      // Create new user
      user = new this({
        auth0Id: auth0User.sub,
        email: auth0User.email,
        name: auth0User.name,
        picture: auth0User.picture,
        emailVerified: auth0User.email_verified,
        nickname: auth0User.nickname
      });
      await user.save();
    } else {
      // Update existing user with latest Auth0 data
      user.email = auth0User.email;
      user.name = auth0User.name;
      user.picture = auth0User.picture;
      user.emailVerified = auth0User.email_verified;
      user.nickname = auth0User.nickname;
      user.updatedAt = new Date();
      await user.save();
    }
    
    return user;
  } catch (error) {
    throw new Error(`Error finding or creating user: ${error.message}`);
  }
};

const User = mongoose.model('User', userSchema);

export default User; 
