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
    console.log('Extracted auth0Id:', auth0Id);
    
    if (!auth0Id) {
      throw new Error('Missing Auth0 user ID (sub or user_id)');
    }
    
    console.log('Looking for existing user with auth0Id:', auth0Id);
    let user = await this.findOne({ auth0Id: auth0Id });
    console.log('Existing user found:', user ? 'Yes' : 'No');

    // Robust extraction with fallback
    let name = auth0User.name || auth0User.nickname || auth0User.email || fallbackName || 'New User';
    const email = auth0User.email;
    const picture = auth0User.picture;
    const emailVerified = auth0User.email_verified;
    const nickname = auth0User.nickname;
    
    console.log('Extracted user data:', {
      name,
      email,
      picture,
      emailVerified,
      nickname
    });

    if (!user) {
      console.log('Creating new user...');
      // Check for duplicate email
      if (email) {
        console.log('Checking for duplicate email:', email);
        const existingEmailUser = await this.findOne({ email });
        if (existingEmailUser) {
          console.log('Duplicate email found:', existingEmailUser.auth0Id);
          throw new Error('DUPLICATE_EMAIL');
        }
      }
      // Create new user with Auth0 data
      const userData = {
        auth0Id: auth0Id,
        email: email,
        name: name,
        picture: picture,
        emailVerified: emailVerified,
        nickname: nickname
      };
      console.log('Creating user with data:', userData);
      
      user = new this(userData);
      console.log('User object created, saving...');
      await user.save();
      console.log('User saved successfully');
    } else {
      console.log('Updating existing user...');
      // Do NOT overwrite user-editable fields with Auth0 data
      // Optionally, update emailVerified if it changed
      if (typeof emailVerified === 'boolean' && user.emailVerified !== emailVerified) {
        user.emailVerified = emailVerified;
      }
      user.updatedAt = new Date();
      await user.save();
      console.log('User updated successfully');
    }
    console.log('Returning user:', user._id);
    return user;
  } catch (error) {
    console.error('Error in findOrCreateFromAuth0:', error);
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
