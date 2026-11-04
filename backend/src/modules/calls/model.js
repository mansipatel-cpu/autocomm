import mongoose from '../../common/db/postgres-model.js';

const callRecordSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    callId: {
      type: String,
      required: true,
      index: true,
    },
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      index: true,
    },
    agentName: {
      type: String,
      default: 'Rachel (AgentLab)',
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
    direction: {
      type: String,
      default: 'outbound',
      index: true,
    },
    status: {
      type: String,
      default: 'COMPLETED',
      index: true,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    recordingUrl: {
      type: String,
      default: 'https://assets.autocomm.io/recordings/sample_call.mp3',
    },
    sentiment: {
      type: String,
      default: 'Positive',
    },
    summary: {
      type: String,
      default: '',
    },
    transcripts: {
      type: Array,
      default: [],
    },
    creditsUsed: {
      type: Number,
      default: 1.0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const CallRecord = mongoose.model('CallRecord', callRecordSchema);
