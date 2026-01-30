const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
    minlength: [2, 'Username must be at least 2 characters'],
    maxlength: [32, 'Username cannot exceed 32 characters'],
    match: [/^[a-zA-Z0-9ğüşöçİĞÜŞÖÇ_.\s-]+$/, 'Username contains invalid characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  publicKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: [200, 'Bio cannot exceed 200 characters'],
    default: ''
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'idle', 'dnd'],
    default: 'offline'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  preferences: {
    theme: {
      type: String,
      enum: ['dark', 'light', 'amoled'],
      default: 'dark'
    },
    language: {
      type: String,
      default: 'tr'
    },
    fontSize: {
      type: String,
      enum: ['small', 'normal', 'large'],
      default: 'normal'
    },
    compactMode: {
      type: Boolean,
      default: false
    },
    allowDMs: {
      type: String,
      enum: ['everyone', 'friends'],
      default: 'friends'
    },
    readReceipts: {
      type: Boolean,
      default: true
    }
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ publicKey: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ createdAt: -1 });

// Virtual for online status
UserSchema.virtual('isOnline').get(function() {
  if (this.status === 'online') return true;
  return Date.now() - this.lastSeen < 300000; // 5 minutes
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Update lastSeen on status change
UserSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.lastSeen = Date.now();
  }
  next();
});

// Update timestamps
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Match password method
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Check if account is locked
UserSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
UserSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { failedLoginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  // Otherwise we're incrementing
  const updates = { $inc: { failedLoginAttempts: 1 } };
  
  // Lock the account if we've reached max attempts and it's not already locked
  if (this.failedLoginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
UserSchema.methods.resetAttempts = function() {
  return this.updateOne({
    $set: { failedLoginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

module.exports = mongoose.model('User', UserSchema);