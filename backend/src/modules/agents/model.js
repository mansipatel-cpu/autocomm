import mongoose from 'mongoose';

const agentSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ['incoming', 'outgoing', 'flow'],
      default: 'incoming',
      index: true,
    },
    voiceId: {
      type: String,
      default: 'rachel_warm_us',
    },
    voiceName: {
      type: String,
      default: 'Rachel (Warm & Engaging)',
    },
    language: {
      type: String,
      default: 'en-US',
    },
    greetingMessage: {
      type: String,
      default: 'Hello! Thank you for calling AutoComm. How can I assist you today?',
    },
    systemPrompt: {
      type: String,
      default: 'You are an intelligent, empathetic customer support voice agent. Speak clearly, concisely, and resolve customer questions naturally.',
    },
    assignedPhoneNumber: {
      type: String,
      default: '',
    },
    knowledgeSourceIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'KnowledgeSource',
      },
    ],
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      index: true,
    },
    callSettings: {
      maxCallDurationSeconds: {
        type: Number,
        default: 600,
      },
      silenceTimeoutSeconds: {
        type: Number,
        default: 10,
      },
      recordCall: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Agent = mongoose.model('Agent', agentSchema);
