import mongoose from 'mongoose';

const knowledgeSourceSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['url', 'text', 'file'],
      required: true,
      index: true,
    },
    url: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      default: '',
      maxlength: 300000, // up to 300k chars
    },
    fileName: {
      type: String,
      default: '',
    },
    fileSize: {
      type: Number, // in bytes
      default: 0,
    },
    fileType: {
      type: String,
      default: '',
    },
    characterCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['INDEXED', 'PROCESSING', 'FAILED'],
      default: 'INDEXED',
      index: true,
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

knowledgeSourceSchema.index({ clientId: 1, type: 1 });

export const KnowledgeSource = mongoose.model('KnowledgeSource', knowledgeSourceSchema);
