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
    
    // Handle both 'sub' and 'user_id' field names
    const auth0Id = auth0User.sub || auth0User.user_id;
    if (!auth0Id) {
      throw new Error('Missing Auth0 user ID (sub or user_id)');
    }
    
    let user = await this.findOne({ auth0Id: auth0Id });

    // Robust extraction with fallback
    let name = auth0User.name || auth0User.nickname || auth0User.email || fallbackName || 'New User';
    const email = auth0User.email;
    const picture = auth0User.picture;
    const emailVerified = auth0User.email_verified;
    const nickname = auth0User.nickname;

    if (!user) {
      // Check for duplicate email
      if (email) {
        const existingEmailUser = await this.findOne({ email });
        if (existingEmailUser) {
          throw new Error('DUPLICATE_EMAIL');
        }
      }
      // Create new user with Auth0 data
      user = new this({
        auth0Id: auth0Id,
        email: email,
        name: name,
        picture: picture,
        emailVerified: emailVerified,
        nickname: nickname
      });
      await user.save();
    } else {
      // Do NOT overwrite user-editable fields with Auth0 data
      // Optionally, update emailVerified if it changed
      if (typeof emailVerified === 'boolean' && user.emailVerified !== emailVerified) {
        user.emailVerified = emailVerified;
      }
      user.updatedAt = new Date();
      await user.save();
    }
    return user;
  } catch (error) {
    if (error.message === 'DUPLICATE_EMAIL') {
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
