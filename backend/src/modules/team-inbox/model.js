import mongoose from '../../common/db/postgres-model.js';

const conversationSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel',
      index: true,
    },
    channelName: {
      type: String,
      default: 'capermint',
    },
    contactPhoneNumber: {
      type: String,
      required: true,
      index: true,
    },
    contactName: {
      type: String,
      default: 'Customer',
    },
    status: {
      type: String,
      enum: ['OPEN', 'Resolved'],
      default: 'OPEN',
      index: true,
    },
    source: {
      type: String,
      enum: ['WA', 'Widget'],
      default: 'WA',
      index: true,
    },
    assignedTo: {
      type: String,
      default: 'AutoComm Bot',
    },
    unreadCount: {
      type: Number,
      default: 0,
    },
    lastMessageText: {
      type: String,
      default: '',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    lastInboundAt: {
      type: Date,
      default: Date.now,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ clientId: 1, contactPhoneNumber: 1 }, { unique: true });

export const Conversation = mongoose.model('Conversation', conversationSchema);

const messageSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: true,
    },
    senderType: {
      type: String,
      enum: ['contact', 'agent', 'bot'],
      default: 'contact',
    },
    messageType: {
      type: String,
      enum: ['text', 'template', 'image', 'document'],
      default: 'text',
    },
    body: {
      type: String,
      required: true,
    },
    templateName: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read', 'failed'],
      default: 'delivered',
    },
    metaMessageId: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversationId: 1, timestamp: 1 });

export const Message = mongoose.model('Message', messageSchema);
