import mongoose from '../../common/db/postgres-model.js';

const conversationFlowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    assignedClientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
      index: true,
    },
    assignedClientName: {
      type: String,
      default: 'Global System Template',
    },
    voiceAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      default: null,
    },
    voiceAgentName: {
      type: String,
      default: '',
    },
    assignedPhoneNumber: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
    },
    nodes: {
      type: Array,
      default: [
        { id: '1', type: 'message', label: 'Welcome Message', prompt: 'Hello! Thanks for reaching out to AutoComm.', position: { x: 100, y: 100 } },
        { id: '2', type: 'question', label: 'Inquiry Intent', question: 'How can I assist your team today?', position: { x: 100, y: 220 } },
        { id: '3', type: 'condition', label: 'Check Intent', condition: 'intent == "support"', position: { x: 100, y: 340 } },
        { id: '4', type: 'appointment', label: 'Book Demo Slot', calendarId: 'primary', position: { x: 260, y: 460 } },
        { id: '5', type: 'transfer', label: 'Transfer to Specialist', destinationNumber: '+18005550199', position: { x: -40, y: 460 } },
      ],
    },
    edges: {
      type: Array,
      default: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' },
        { id: 'e3-4', source: '3', target: '4', label: 'Sales / Demo' },
        { id: 'e3-5', source: '3', target: '5', label: 'Technical Support' },
      ],
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ConversationFlow = mongoose.model('ConversationFlow', conversationFlowSchema);
