const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  roomId: {
    type: String,
    index: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  mediaUrl: String,
  fileName: String,
  fileSize: Number,
  mimeType: String,
  encrypted: {
    type: Boolean,
    default: false
  },
  encryptedContent: String,
  publicKey: String,
  signature: String,
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: Date
  }],
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  pinned: {
    type: Boolean,
    default: false
  },
  pinnedAt: Date,
  pinnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    location: {
      lat: Number,
      lng: Number
    }
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
MessageSchema.index({ sender: 1, createdAt: -1 });
MessageSchema.index({ recipient: 1, createdAt: -1 });
MessageSchema.index({ roomId: 1, createdAt: -1 });
MessageSchema.index({ createdAt: -1 });
MessageSchema.index({ type: 1 });
MessageSchema.index({ encrypted: 1 });

// Update timestamps
MessageSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for read status
MessageSchema.virtual('isRead').get(function() {
  return this.readBy && this.readBy.length > 0;
});

// Virtual for message preview
MessageSchema.virtual('preview').get(function() {
  if (this.type === 'text') {
    return this.content.substring(0, 100) + (this.content.length > 100 ? '...' : '');
  }
  return `[${this.type.toUpperCase()}]`;
});

module.exports = mongoose.model('Message', MessageSchema);