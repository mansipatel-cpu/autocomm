import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
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
    code: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      default: 'Customer Segments',
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      default: 'Active',
      enum: ['Active', 'Inactive'],
    },
    contactCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

groupSchema.index({ clientId: 1, name: 1 }, { unique: true });

export const Group = mongoose.model('Group', groupSchema);

const groupMemberSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
      index: true,
    },
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      required: true,
      index: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

groupMemberSchema.index({ groupId: 1, contactId: 1 }, { unique: true });

export const GroupMember = mongoose.model('GroupMember', groupMemberSchema);
