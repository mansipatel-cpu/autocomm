import mongoose from '../../common/db/postgres-model.js';

export const CRM_STAGES = ['NEW_LEAD', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'WON', 'LOST'];

const crmLeadSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    contactName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      default: '',
    },
    stage: {
      type: String,
      enum: CRM_STAGES,
      default: 'NEW_LEAD',
      index: true,
    },
    dealValue: {
      type: Number,
      default: 0,
    },
    source: {
      type: String,
      enum: ['AgentLab Call', 'WhatsApp', 'Manual'],
      default: 'AgentLab Call',
    },
    assignedTo: {
      type: String,
      default: 'Unassigned',
    },
    sentiment: {
      type: String,
      enum: ['Positive', 'Neutral', 'Negative'],
      default: 'Neutral',
    },
    tags: {
      type: [String],
      default: ['Hot Lead'],
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

crmLeadSchema.index({ clientId: 1, stage: 1 });

export const CrmLead = mongoose.model('CrmLead', crmLeadSchema);
