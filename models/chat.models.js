import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const chatConversationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  clientId: {
    type: String,
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'New Conversation'
  },
  context: {
    type: String,
    enum: ['general', 'health', 'support', 'technical', 'cancer'],
    default: 'general'
  },
  messages: [messageSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  totalTokensUsed: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
chatConversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.lastActivity = new Date();
  next();
});

// Index for better query performance
chatConversationSchema.index({ userId: 1, createdAt: -1 });
chatConversationSchema.index({ sessionId: 1, isActive: 1 });

// Virtual for message count
chatConversationSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Method to add a message
chatConversationSchema.methods.addMessage = function(role, content, metadata = {}) {
  this.messages.push({
    role,
    content,
    timestamp: new Date(),
    metadata
  });
  return this;
};

// Method to get conversation history for AI
chatConversationSchema.methods.getConversationHistory = function(limit = 10) {
  return this.messages
    .filter(msg => msg.role !== 'system')
    .slice(-limit)
    .map(msg => ({
      role: msg.role,
      content: msg.content
    }));
};

// Static method to find or create conversation
chatConversationSchema.statics.findOrCreateConversation = async function(userId, clientId, sessionId, context = 'general') {
  let conversation = await this.findOne({
    userId,
    sessionId,
    isActive: true
  });

  if (!conversation) {
    conversation = new this({
      userId,
      clientId,
      sessionId,
      context,
      title: `${context.charAt(0).toUpperCase() + context.slice(1)} Chat`
    });
    await conversation.save();
  }

  return conversation;
};

// Static method to get user's recent conversations
chatConversationSchema.statics.getUserConversations = async function(userId, limit = 20) {
  return this.find({ userId })
    .sort({ lastActivity: -1 })
    .limit(limit)
    .select('sessionId title context messageCount lastActivity createdAt totalTokensUsed');
};

export const ChatConversation = mongoose.model('ChatConversation', chatConversationSchema);