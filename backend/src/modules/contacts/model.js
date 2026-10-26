import mongoose from '../../common/db/postgres-model.js';

const contactSchema = new mongoose.Schema(
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
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    whatsappNumber: {
      type: String,
      trim: true,
      default: '',
    },
    channels: {
      type: [String],
      enum: ['whatsapp', 'voice'],
      default: ['whatsapp', 'voice'],
    },
    channelId: {
      type: Number,
      default: 4,
    },
    status: {
      type: String,
      enum: ['Active', 'Pending', 'Inactive'],
      default: 'Active',
      index: true,
    },
    groups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
      },
    ],
    customVariables: {
      type: Map,
      of: String,
      default: {},
    },
    lastContactAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

contactSchema.index({ clientId: 1, phoneNumber: 1 }, { unique: true });
contactSchema.index({ clientId: 1, name: 'text', email: 'text', phoneNumber: 'text' });

export const Contact = mongoose.model('Contact', contactSchema);
