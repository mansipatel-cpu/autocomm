import mongoose from 'mongoose';
import { CLIENT_STATUS } from '../../config/constants.js';

const clientSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    clientCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(CLIENT_STATUS),
      default: CLIENT_STATUS.ACTIVE,
      index: true,
    },
    plan: {
      type: String,
      default: 'Enterprise Scale',
      enum: ['Enterprise Scale', 'Growth', 'Starter'],
    },
    contactNumber: {
      type: String,
      required: true,
      trim: true,
    },
    adminEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    assignedPhoneNumbers: {
      type: [String],
      default: [],
    },
    credits: {
      type: Number,
      default: 10000,
    },
    settings: {
      defaultLanguage: { type: String, default: 'en_US' },
      maxConcurrentCalls: { type: Number, default: 25 },
      timezone: { type: String, default: 'America/New_York' },
      enableAutoRetry: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

clientSchema.index({ companyName: 'text', clientCode: 'text', adminEmail: 'text' });

export const Client = mongoose.model('Client', clientSchema);
