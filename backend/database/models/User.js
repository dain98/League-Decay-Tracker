import mongoose from 'mongoose';
import axios from 'axios';

const userSchema = new mongoose.Schema({
  auth0Id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
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
userSchema.statics.findOrCreateFromAuth0 = async function(auth0User, fallbackName) {
  try {
    console.log('Auth0 user received in findOrCreateFromAuth0:', auth0User);
    let user = await this.findOne({ auth0Id: auth0User.sub });

    // Robust extraction with fallback
    let name = auth0User.name || auth0User.nickname || auth0User.email || fallbackName;
    const email = auth0User.email;
    const picture = auth0User.picture;
    const emailVerified = auth0User.email_verified;
    const nickname = auth0User.nickname;

    if (!name) {
      throw new Error('MISSING_NAME');
    }

    if (!user) {
      // Check for duplicate email
      if (email) {
        const existingEmailUser = await this.findOne({ email });
        if (existingEmailUser) {
          throw new Error('DUPLICATE_EMAIL');
        }
      }
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
    if (error.message === 'MISSING_NAME' || error.message === 'DUPLICATE_EMAIL') {
      throw error;
    }
    // Handle MongoDB duplicate key error for email
    if (error.code === 11000 && error.keyPattern && error.keyPattern.email) {
      throw new Error('DUPLICATE_EMAIL');
    }
    throw new Error(`Error finding or creating user: ${error.message}`);
  }
};

async function getUserProfileFromAuth0(accessToken) {
  const response = await axios.get('https://YOUR_DOMAIN.auth0.com/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  return response.data;
}

const User = mongoose.model('User', userSchema);

export default User; 
