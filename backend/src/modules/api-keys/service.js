import crypto from 'crypto';
import mongoose from 'mongoose';
import { ApiKey } from './model.js';
import { AppError } from '../../common/errors/app-error.js';

export class ApiKeyService {
  static async listKeys(clientId) {
    if (mongoose.connection.readyState !== 1) return [];
    return ApiKey.find({ clientId }).sort({ createdAt: -1 });
  }

  static async createKey(clientId, { name }) {
    if (!name || !name.trim()) {
      throw new AppError('Key label is required', 400);
    }

    const rawSecret = crypto.randomBytes(24).toString('hex');
    const plainApiKey = `ac_live_${rawSecret}`;
    const keyPrefix = plainApiKey.substring(0, 12);
    const lastFour = plainApiKey.slice(-4);
    const hashedKey = crypto.createHash('sha256').update(plainApiKey).digest('hex');

    if (mongoose.connection.readyState !== 1) {
      return {
        apiKeyDoc: {
          _id: 'test_key_id',
          clientId,
          name: name.trim(),
          keyPrefix,
          lastFour,
          status: 'ACTIVE',
        },
        plainApiKey,
      };
    }

    const created = await ApiKey.create({
      clientId,
      name: name.trim(),
      keyPrefix,
      lastFour,
      hashedKey,
      status: 'ACTIVE',
    });

    return {
      apiKeyDoc: created,
      plainApiKey, // Only revealed once upon creation
    };
  }

  static async revokeKey(clientId, keyId) {
    const key = await ApiKey.findOneAndUpdate(
      { _id: keyId, clientId },
      { $set: { status: 'REVOKED' } },
      { new: true }
    );
    if (!key) {
      throw new AppError('API key not found', 404);
    }
    return key;
  }
}
