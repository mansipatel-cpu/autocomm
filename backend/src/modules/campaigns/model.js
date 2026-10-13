import mongoose from '../../common/db/postgres-model.js';
import { CAMPAIGN_STATUS, CHANNEL_TYPES } from '../../config/constants.js';

const campaignSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    campaignCode: {
      type: String,
      required: true,
      trim: true,
    },
    channelType: {
      type: String,
      enum: Object.values(CHANNEL_TYPES),
      required: true,
      index: true,
    },
    campaignType: {
      type: String,
      default: 'Marketing', // Marketing, Billing, Onboarding, Lead Qualification, Feedback Collection
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(CAMPAIGN_STATUS),
      default: CAMPAIGN_STATUS.DRAFT,
      index: true,
    },

    // Whatway (WhatsApp) specific
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Template',
      default: null,
    },
    templateName: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: 'en_US',
    },
    enableAutoRetry: {
      type: Boolean,
      default: false,
    },

    // AgentLab (Auto Calling) specific
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AIAgent',
      default: null,
    },
    agentName: {
      type: String,
      default: '',
    },
    phoneNumber: {
      type: String,
      default: '',
    },
    visualFlowName: {
      type: String,
      default: '',
    },
    customScript: {
      type: String,
      default: '',
    },
    campaignGoal: {
      type: String,
      default: '',
    },
    callScheduling: {
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: '09:00 AM' },
      endTime: { type: String, default: '05:00 PM' },
      daysOfWeek: { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      timezone: { type: String, default: 'America/New_York (EST, UTC-5)' },
    },

    // Audience & Scheduling
    targetGroupIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
      },
    ],
    audienceSegmentName: {
      type: String,
      default: 'All Targeted Contacts',
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },

    // Progress & Metrics
    metrics: {
      totalRecipients: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      read: { type: Number, default: 0 },
      answered: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      progressPercent: { type: Number, default: 0 },
    },

    // Soft deletion & 30-day purge
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    deletedByUserName: {
      type: String,
      default: 'Admin User',
    },
  },
  {
    timestamps: true,
  }
);

campaignSchema.index({ clientId: 1, isDeleted: 1, channelType: 1 });

export const Campaign = mongoose.model('Campaign', campaignSchema);

const campaignRecipientSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    name: {
      type: String,
      default: 'Recipient',
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: 'en',
    },
    city: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'read', 'answered', 'failed'],
      default: 'pending',
      index: true,
    },
    errorDetails: {
      type: String,
      default: '',
    },
    customVariables: {
      type: Map,
      of: String,
      default: {},
    },
    dispatchedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

campaignRecipientSchema.index({ campaignId: 1, phoneNumber: 1 });

export const CampaignRecipient = mongoose.model('CampaignRecipient', campaignRecipientSchema);
