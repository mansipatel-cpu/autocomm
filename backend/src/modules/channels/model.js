import mongoose from '../../common/db/postgres-model.js';

// Schema matches the actual PostgreSQL `channels` table columns:
// id, client_id, channel_name, phone_number_id, waba_id, access_token,
// status, webhook_verify_token, created_at, updated_at
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
    phoneNumberId: {
      type: String,
      default: '',
    },
    wabaId: {
      type: String,
      default: '',
    },
    accessToken: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['CONNECTED', 'DISCONNECTED', 'Active', 'Inactive', 'Disconnected'],
      default: 'CONNECTED',
      index: true,
    },
    webhookVerifyToken: {
      type: String,
      default: '',
    },
    healthStatus: {
      type: String,
      enum: ['healthy', 'warning', 'error', 'unknown'],
      default: 'unknown',
    },
    healthDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lastHealthCheck: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

channelSchema.index({ clientId: 1, status: 1 });

export const Channel = mongoose.model('Channel', channelSchema);
