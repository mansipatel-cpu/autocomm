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
    nodes: {
      type: Array,
      default: [
        { id: '1', type: 'trigger', label: 'Call Started', position: { x: 100, y: 100 } },
        { id: '2', type: 'speech', label: 'Greeting & Qualification', position: { x: 100, y: 220 } },
        { id: '3', type: 'decision', label: 'Customer Interested?', position: { x: 100, y: 340 } },
        { id: '4', type: 'action', label: 'Schedule Calendar Demo', position: { x: 260, y: 460 } },
        { id: '5', type: 'speech', label: 'Polite Farewell & Log', position: { x: -40, y: 460 } },
      ],
    },
    edges: {
      type: Array,
      default: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' },
        { id: 'e3-4', source: '3', target: '4', label: 'Yes / Interested' },
        { id: 'e3-5', source: '3', target: '5', label: 'No / Busy' },
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
