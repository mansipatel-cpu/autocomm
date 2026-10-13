import mongoose from '../../common/db/postgres-model.js';

const transcriptLineSchema = new mongoose.Schema({
  speaker: {
    type: String,
    enum: ['agent', 'user'],
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  timestampSeconds: {
    type: Number,
    default: 0,
  },
});

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
      enum: ['inbound', 'outbound'],
      default: 'outbound',
      index: true,
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'BUSY', 'NO_ANSWER', 'FAILED'],
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
    transcript: {
      type: [transcriptLineSchema],
      default: [],
    },
    aiSummary: {
      type: String,
      default: '',
    },
    sentiment: {
      type: String,
      enum: ['Positive', 'Neutral', 'Negative'],
      default: 'Positive',
    },
    costCredits: {
      type: Number,
      default: 1.5,
    },
    callDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

callRecordSchema.index({ clientId: 1, callDate: -1 });

export const CallRecord = mongoose.model('CallRecord', callRecordSchema);
