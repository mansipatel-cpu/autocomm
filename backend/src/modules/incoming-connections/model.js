import mongoose from '../../common/db/postgres-model.js';

const incomingConnectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    provider: {
      type: String,
      enum: ['Twilio', 'Plivo', 'Meta WABA', 'SIP Trunk', 'Vonage'],
      default: 'Twilio',
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
      index: true,
    },
    phoneNumber: {
      type: String,
      default: '',
    },
    webhookUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
    logs: {
      type: Array,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const IncomingConnection = mongoose.model('IncomingConnection', incomingConnectionSchema);
