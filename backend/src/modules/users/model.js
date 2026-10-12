import mongoose from 'mongoose';
import { ROLES, USER_STATUS } from '../../config/constants.js';

const userSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      index: true,
      default: null, // null for platform Super Admins
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.ADMIN_OPERATOR,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
      index: true,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Unique email per tenant, global unique for super admin
userSchema.index({ email: 1, clientId: 1 }, { unique: true });

export const User = mongoose.model('User', userSchema);
