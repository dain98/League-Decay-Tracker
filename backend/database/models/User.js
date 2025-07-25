import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firebaseUid: {
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
  ref: 'UserLeagueAccount',
  localField: '_id',
  foreignField: 'userId'
});

// Pre-save middleware to update the updatedAt field
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to find or create user from Firebase data
userSchema.statics.findOrCreateFromFirebase = async function(firebaseUser, fallbackName) {
  try {
    console.log('Firebase user received in findOrCreateFromFirebase:', firebaseUser);
    
    const firebaseUid = firebaseUser.sub || firebaseUser.uid;
    console.log('Extracted firebaseUid:', firebaseUid);
    
    if (!firebaseUid) {
      throw new Error('Missing Firebase user ID (sub or uid)');
    }
    
    console.log('Looking for existing user with firebaseUid:', firebaseUid);
    let user = await this.findOne({ firebaseUid: firebaseUid });
    console.log('Existing user found by firebaseUid:', user ? 'Yes' : 'No');

    // Robust extraction with fallback
    let name = firebaseUser.name || firebaseUser.nickname || firebaseUser.email || fallbackName || 'New User';
    const email = firebaseUser.email;
    const picture = firebaseUser.picture;
    const emailVerified = firebaseUser.email_verified;
    const nickname = firebaseUser.nickname;
    
    console.log('Extracted user data:', {
      name,
      email,
      picture,
      emailVerified,
      nickname
    });

    if (!user) {
      // Check if a user with this email already exists
      if (email) {
        console.log('Checking for existing user with email:', email);
        const existingUserByEmail = await this.findOne({ email: email });
        if (existingUserByEmail) {
          console.log('User with email already exists, updating firebaseUid');
          // Update the existing user's firebaseUid to link the accounts
          existingUserByEmail.firebaseUid = firebaseUid;
          // Optionally update other fields that might have changed
          if (typeof emailVerified === 'boolean' && existingUserByEmail.emailVerified !== emailVerified) {
            existingUserByEmail.emailVerified = emailVerified;
          }
          existingUserByEmail.updatedAt = new Date();
          await existingUserByEmail.save();
          user = existingUserByEmail;
          console.log('Existing user updated with new firebaseUid');
        } else {
          console.log('Creating new user...');
          // Create new user with Firebase data
          const userData = {
            firebaseUid: firebaseUid,
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
        }
      } else {
        console.log('Creating new user without email...');
        // Create new user with Firebase data
        const userData = {
          firebaseUid: firebaseUid,
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
      }
    } else {
      console.log('Updating existing user...');
      // Do NOT overwrite user-editable fields with Firebase data
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
    console.error('Error in findOrCreateFromFirebase:', error);
    throw new Error(`Error finding or creating user: ${error.message}`);
  }
};

const User = mongoose.model('User', userSchema);

export default User; 
