import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    channelName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    metaAppId: {
      type: String,
      required: true,
    },
    phoneNumberId: {
      type: String,
      required: true,
    },
    wabaId: {
      type: String,
      required: true,
    },
    accessTokenEncrypted: {
      type: String,
      required: true,
    },
    businessAccountId: {
      type: String,
      default: '',
    },
    throughputRate: {
      type: String,
      default: '80 msg/sec',
    },
    status: {
      type: String,
      enum: ['Active', 'Disconnected', 'Inactive'],
      default: 'Active',
      index: true,
    },
    health: {
      overall: { type: String, default: 'Healthy' },
      accountMode: { type: String, default: 'LIVE' },
      qualityRating: { type: String, default: 'GREEN' },
      messagingLimit: { type: String, default: 'Unconfirmed' },
      throughput: { type: String, default: 'STANDARD' },
      verification: { type: String, default: 'EXPIRED' },
      nameStatus: { type: String, default: 'APPROVED' },
      messagingAvailability: { type: String, default: 'AVAILABLE' },
      deliveryWebhooks: { type: String, default: 'Subscribed' },
      lastCheckedAt: { type: Date, default: Date.now },
    },
    businessProfile: {
      displayName: { type: String, default: '' },
      profilePhotoUrl: { type: String, default: '' },
      about: { type: String, maxlength: 139, default: '' },
      description: { type: String, maxlength: 512, default: '' },
      address: { type: String, default: '' },
      email: { type: String, default: '' },
      websites: { type: [String], default: [] },
      industry: { type: String, default: 'Other' },
    },
    displayNameRequests: [
      {
        requestedName: String,
        status: { type: String, default: 'Pending Meta Review' },
        requestedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

channelSchema.index({ clientId: 1, phoneNumber: 1 });

export const Channel = mongoose.model('Channel', channelSchema);
