const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Room name is required'],
    trim: true,
    maxlength: [100, 'Room name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
    default: ''
  },
  type: {
    type: String,
    enum: ['public', 'private', 'direct'],
    default: 'public'
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'admin'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastSeen: Date
  }],
  avatar: {
    type: String,
    default: ''
  },
  banner: {
    type: String,
    default: ''
  },
  settings: {
    allowMessages: {
      type: Boolean,
      default: true
    },
    allowVoice: {
      type: Boolean,
      default: true
    },
    allowVideo: {
      type: Boolean,
      default: true
    },
    allowFileSharing: {
      type: Boolean,
      default: true
    },
    maxFileSize: {
      type: Number,
      default: 10 // MB
    },
    messageCooldown: {
      type: Number,
      default: 0 // seconds
    }
  },
  invites: [{
    code: {
      type: String,
      unique: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    maxUses: Number,
    uses: {
      type: Number,
      default: 0
    },
    expiresAt: Date,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  bans: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    bannedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date
  }],
  mutedUsers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    mutedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    mutedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date
  }],
  pinnedMessages: [{
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    pinnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  messageCount: {
    type: Number,
    default: 0
  },
  memberCount: {
    type: Number,
    default: 1
  },
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

// Indexes for performance
RoomSchema.index({ name: 'text', description: 'text' });
RoomSchema.index({ creator: 1 });
RoomSchema.index({ type: 1 });
RoomSchema.index({ tags: 1 });
RoomSchema.index({ createdAt: -1 });
RoomSchema.index({ lastActivity: -1 });
RoomSchema.index({ memberCount: -1 });

// Update timestamps
RoomSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Update member count
RoomSchema.pre('save', function(next) {
  if (this.isModified('members')) {
    this.memberCount = this.members.length;
  }
  next();
});

// Virtual for online member count
RoomSchema.virtual('onlineMemberCount').get(function() {
  return this.members.filter(member => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return member.lastSeen && member.lastSeen > fiveMinutesAgo;
  }).length;
});

// Virtual for isMember check
RoomSchema.virtual('isMember').get(function() {
  return function(userId) {
    return this.members.some(member => member.user.toString() === userId.toString());
  };
});

// Virtual for user role in room
RoomSchema.virtual('getUserRole').get(function() {
  return function(userId) {
    const member = this.members.find(m => m.user.toString() === userId.toString());
    return member ? member.role : null;
  };
});

// Method to add member
RoomSchema.methods.addMember = function(userId, role = 'member') {
  const existingMember = this.members.find(m => m.user.toString() === userId.toString());
  if (!existingMember) {
    this.members.push({
      user: userId,
      role: role,
      joinedAt: Date.now()
    });
    this.memberCount = this.members.length;
  }
  return this.save();
};

// Method to remove member
RoomSchema.methods.removeMember = function(userId) {
  this.members = this.members.filter(m => m.user.toString() !== userId.toString());
  this.memberCount = this.members.length;
  return this.save();
};

// Method to check if user is banned
RoomSchema.methods.isBanned = function(userId) {
  return this.bans.some(ban => {
    if (ban.user.toString() !== userId.toString()) return false;
    if (!ban.expiresAt) return true; // Permanent ban
    return ban.expiresAt > Date.now(); // Temporary ban still active
  });
};

// Method to check if user is muted
RoomSchema.methods.isMuted = function(userId) {
  return this.mutedUsers.some(mute => {
    if (mute.user.toString() !== userId.toString()) return false;
    if (!mute.expiresAt) return true; // Permanent mute
    return mute.expiresAt > Date.now(); // Temporary mute still active
  });
};

module.exports = mongoose.model('Room', RoomSchema);