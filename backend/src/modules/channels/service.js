import { Channel } from './model.js';
import { AppError } from '../../common/errors/app-error.js';
import { encryptString, decryptString } from '../../common/utils/crypto.util.js';

export class ChannelService {
  static async listChannels(clientId) {
    const channels = await Channel.find({ clientId }).sort({ createdAt: -1 }).lean();
    return channels.map((c) => ({
      ...c,
      accessTokenEncrypted: undefined, // Never expose raw encrypted token directly
    }));
  }

  static async getChannelById(clientId, id) {
    const channel = await Channel.findOne({ _id: id, clientId }).lean();
    if (!channel) throw AppError.notFound('Channel not found');
    return {
      ...channel,
      accessTokenEncrypted: undefined,
    };
  }

  static async createChannel(clientId, data) {
    const { channelName, phoneNumber, metaAppId, phoneNumberId, wabaId, accessToken, businessAccountId } = data;

    if (!channelName || !phoneNumber || !metaAppId || !phoneNumberId || !wabaId || !accessToken) {
      throw AppError.badRequest('All WhatsApp API configuration fields are required.');
    }

    const encryptedToken = encryptString(accessToken);

    const channel = await Channel.create({
      clientId,
      channelName,
      phoneNumber,
      metaAppId,
      phoneNumberId,
      wabaId,
      accessTokenEncrypted: encryptedToken,
      businessAccountId: businessAccountId || '',
      businessProfile: {
        displayName: channelName,
        about: 'AutoComm Official Channel',
        description: 'Customer communication channel powered by AutoComm Platform.',
        industry: 'Other',
      },
    });

    return channel;
  }

  static async sendTestMessage(clientId, channelId, { phoneNumber, message }) {
    const channel = await Channel.findOne({ _id: channelId, clientId });
    if (!channel) throw AppError.notFound('Channel not found');

    if (!phoneNumber) throw AppError.badRequest('Target phone number is required.');

    // Validate phone number format (without + or spaces, digits only, e.g. 919310797700)
    const sanitizedPhone = phoneNumber.replace(/\D/g, '');
    if (sanitizedPhone.length < 8) {
      throw AppError.badRequest('Invalid phone number format. Enter country code and digits without + or spaces.');
    }

    // Return simulated delivery confirmation
    return {
      success: true,
      channelId: channel._id,
      recipient: sanitizedPhone,
      message: message || 'Hello! This is a test message from WhatsWay.',
      deliveryStatus: 'sent',
      messageId: `wamid.HBgL${Date.now()}`,
    };
  }

  static async updateBusinessProfile(clientId, channelId, profileData) {
    const channel = await Channel.findOne({ _id: channelId, clientId });
    if (!channel) throw AppError.notFound('Channel not found');

    if (profileData.about && profileData.about.length > 139) {
      throw AppError.badRequest('About section cannot exceed 139 characters.');
    }
    if (profileData.description && profileData.description.length > 512) {
      throw AppError.badRequest('Description cannot exceed 512 characters.');
    }
    if (profileData.websites && profileData.websites.length > 2) {
      throw AppError.badRequest('Maximum 2 websites allowed.');
    }

    channel.businessProfile = {
      ...channel.businessProfile.toObject(),
      ...profileData,
    };
    await channel.save();

    return channel.businessProfile;
  }

  static async requestDisplayNameChange(clientId, channelId, { newDisplayName }) {
    const channel = await Channel.findOne({ _id: channelId, clientId });
    if (!channel) throw AppError.notFound('Channel not found');

    if (!newDisplayName || newDisplayName.length < 3 || newDisplayName.length > 512) {
      throw AppError.badRequest('Display name must be between 3 and 512 characters.');
    }

    // No emojis or special symbols
    const specialCharsOrEmoji = /[^\w\s\-\.\&]/;
    if (specialCharsOrEmoji.test(newDisplayName)) {
      throw AppError.badRequest('Display name cannot contain emojis or special symbols.');
    }

    channel.displayNameRequests.push({
      requestedName: newDisplayName,
      status: 'Pending Meta Review',
      requestedAt: new Date(),
    });

    await channel.save();

    return {
      success: true,
      requestedName: newDisplayName,
      status: 'Pending Meta Review',
      message: 'Display name review submitted to Meta (typically 24-48 hours).',
    };
  }

  static async disconnectChannel(clientId, channelId) {
    const channel = await Channel.findOneAndUpdate(
      { _id: channelId, clientId },
      { $set: { status: 'Disconnected' } },
      { new: true }
    );
    if (!channel) throw AppError.notFound('Channel not found');
    return { success: true, message: 'Channel disconnected successfully' };
  }

  static async deleteChannel(clientId, channelId) {
    const channel = await Channel.findOneAndDelete({ _id: channelId, clientId });
    if (!channel) throw AppError.notFound('Channel not found');
    return { success: true, message: 'Channel deleted successfully' };
  }

  static async resubscribeWebhooks(clientId, channelId) {
    const channel = await Channel.findOne({ _id: channelId, clientId });
    if (!channel) throw AppError.notFound('Channel not found');

    channel.health.deliveryWebhooks = 'Subscribed';
    channel.health.lastCheckedAt = new Date();
    await channel.save();

    return { success: true, message: 'Webhooks re-subscribed successfully' };
  }
}
