import mongoose from 'mongoose';

const qaPairSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
});

const aiSettingsSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      unique: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['openai', 'anthropic', 'gemini', 'groq'],
      default: 'openai',
    },
    apiKey: {
      type: String,
      default: '',
    },
    model: {
      type: String,
      default: 'gpt-4o-mini',
    },
    systemPrompt: {
      type: String,
      default: 'You are an intelligent customer support assistant for AutoComm. Be polite, concise, and helpful.',
    },
    temperature: {
      type: Number,
      default: 0.7,
      min: 0,
      max: 1,
    },
    tone: {
      type: String,
      enum: ['Professional', 'Friendly', 'Direct', 'Empathetic'],
      default: 'Friendly',
    },
    escalationKeywords: {
      type: [String],
      default: ['human', 'agent', 'representative', 'manager', 'support'],
    },
    autoEscalate: {
      type: Boolean,
      default: true,
    },
    qaPairs: {
      type: [qaPairSchema],
      default: [
        {
          id: 'qa-1',
          question: 'What are your operating hours?',
          answer: 'We operate 24/7 online, with live human support available Monday to Friday from 9 AM to 6 PM EST.',
        },
        {
          id: 'qa-2',
          question: 'How do I track my order or ticket?',
          answer: 'You can check your status directly on our portal or reply here with your ticket ID.',
        },
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const AiSettings = mongoose.model('AiSettings', aiSettingsSchema);
