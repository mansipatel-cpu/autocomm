import mongoose from '../../common/db/postgres-model.js';

const phoneNumberSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    friendlyName: {
      type: String,
      default: 'Primary Inbound Line',
    },
    country: {
      type: String,
      default: 'US',
    },
    type: {
      type: String,
      enum: ['Local', 'Toll-Free', 'Mobile'],
      default: 'Local',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'AVAILABLE', 'RELEASED'],
      default: 'ACTIVE',
      index: true,
    },
    assignedAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      default: null,
    },
    assignedAgentName: {
      type: String,
      default: 'Unassigned',
    },
    monthlyRate: {
      type: Number,
      default: 15.0,
    },
    forwardingNumber: {
      type: String,
      default: '',
    },
    fallbackNumber: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

phoneNumberSchema.index({ clientId: 1, phoneNumber: 1 });

export const PhoneNumber = mongoose.model('PhoneNumber', phoneNumberSchema);
