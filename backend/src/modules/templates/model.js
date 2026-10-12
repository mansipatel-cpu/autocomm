import mongoose from 'mongoose';
import { META_TEMPLATE_STATUS, VOICE_TEMPLATE_STATUS } from '../../config/constants.js';

const buttonSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['QUICK_REPLY', 'URL', 'PHONE_NUMBER'],
      default: 'QUICK_REPLY',
    },
    text: { type: String, required: true },
    url: { type: String, default: '' },
    phoneNumber: { type: String, default: '' },
  },
  { _id: false }
);

const templateSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['whatsapp', 'voice'],
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    category: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: 'Active',
    },

    // Whatway (WhatsApp) specific
    language: {
      type: String,
      default: 'en_US',
    },
    marketingType: {
      type: String,
      default: 'Custom Promotional',
    },
    headerFormat: {
      type: String,
      enum: ['None', 'Text', 'Image', 'Video', 'Document'],
      default: 'None',
    },
    headerText: {
      type: String,
      maxlength: 60,
      default: '',
    },
    bodyText: {
      type: String,
      maxlength: 1024,
      default: '',
    },
    footerText: {
      type: String,
      maxlength: 60,
      default: '',
    },
    sampleParameters: {
      type: Map,
      of: String,
      default: {},
    },
    buttons: {
      type: [buttonSchema],
      default: [],
    },
    metaStatus: {
      type: String,
      enum: Object.values(META_TEMPLATE_STATUS),
      default: META_TEMPLATE_STATUS.APPROVED,
    },

    // AgentLab (Voice) specific
    synthesisLanguage: {
      type: String,
      default: 'English (US) - Neutral',
    },
    description: {
      type: String,
      default: '',
    },
    firstMessage: {
      type: String,
      maxlength: 300,
      default: '',
    },
    prompt: {
      type: String,
      default: '',
    },
    voiceTone: {
      type: String,
      enum: ['Professional', 'Empathetic', 'Urgent', 'Friendly'],
      default: 'Professional',
    },
    personality: {
      type: String,
      enum: ['Financial Advisor', 'Support Specialist', 'Compliance Officer'],
      default: 'Support Specialist',
    },
    voiceDurationSeconds: {
      type: Number,
      default: 42,
    },
  },
  {
    timestamps: true,
  }
);

templateSchema.index({ clientId: 1, name: 1, type: 1 }, { unique: true });

export const Template = mongoose.model('Template', templateSchema);
