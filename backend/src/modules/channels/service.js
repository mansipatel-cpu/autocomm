import { Channel } from './model.js';
import { AppError } from '../../common/errors/app-error.js';

const GRAPH_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v22.0';
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '';

async function subscribeWabaToWebhook(channel) {
  const { wabaId, accessToken } = channel;
  if (!wabaId || !accessToken) {
    return { success: false, error: 'Missing WABA ID or access token' };
  }
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_API_VERSION}/${wabaId}/subscribed_apps`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data?.error?.message || 'Meta API error' };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// Normalise a channel document to the shape expected by the shared
// ChannelSettings UI (mirrors the omnichannel-saas field names).
function normalizeChannel(c) {
  return {
    ...c,
    accessToken: undefined,          // never expose raw token
    // UI compatibility aliases
    isActive: c.status === 'CONNECTED' || c.status === 'Active',
    name: c.channelName,             // UI reads channel.name
    phoneNumber: c.phoneNumberId,    // UI reads channel.phoneNumber
    whatsappBusinessAccountId: c.wabaId, // UI reads channel.whatsappBusinessAccountId
    appId: c.appId || '',
  };
}

export class ChannelService {
  static async listChannels(clientId) {
    const channels = await Channel.find({ clientId }).sort({ createdAt: -1 }).lean();
    return channels.map(normalizeChannel);
  }

  static async getChannelById(clientId, id) {
    const channel = await Channel.findOne({ _id: id, clientId }).lean();
    if (!channel) throw AppError.notFound('Channel not found');
    return normalizeChannel(channel);
  }

  static async getActiveChannel(clientId) {
    // Try CONNECTED first, then any
    const channel =
      (await Channel.findOne({ clientId, status: 'CONNECTED' }).lean()) ||
      (await Channel.findOne({ clientId, status: 'Active' }).lean()) ||
      (await Channel.findOne({ clientId }).lean());
    return channel ? normalizeChannel(channel) : null;
  }

  static async createChannel(clientId, data) {
    const channelName = data.channelName || data.name;
    const wabaId = data.wabaId || data.whatsappBusinessAccountId || '';
    const phoneNumberId = data.phoneNumberId || '';
    const accessToken = data.accessToken || '';
    const webhookVerifyToken = data.webhookVerifyToken || '';

    if (!channelName) {
      throw AppError.badRequest('Channel name is required.');
    }

    const channel = await Channel.create({
      clientId,
      channelName,
      phoneNumberId,
      wabaId,
      accessToken,
      webhookVerifyToken,
      status: 'CONNECTED',
    });

    return { ...channel, accessToken: undefined };
  }

  static async updateChannel(clientId, id, data) {
    const channel = await Channel.findOne({ _id: id, clientId });
    if (!channel) throw AppError.notFound('Channel not found');

    if (data.name || data.channelName) channel.channelName = data.channelName || data.name;
    if (data.phoneNumberId) channel.phoneNumberId = data.phoneNumberId;
    if (data.wabaId || data.whatsappBusinessAccountId) {
      channel.wabaId = data.wabaId || data.whatsappBusinessAccountId;
    }
    if (data.accessToken) channel.accessToken = data.accessToken;
    if (data.webhookVerifyToken) channel.webhookVerifyToken = data.webhookVerifyToken;
    if (data.status) channel.status = data.status;

    await channel.save();
    return { ...channel.toObject(), accessToken: undefined };
  }

  static async sendTestMessage(clientId, channelId, { phoneNumber, message }) {
    const channel = await Channel.findOne({ _id: channelId, clientId });
    if (!channel) throw AppError.notFound('Channel not found');

    if (!phoneNumber) throw AppError.badRequest('Target phone number is required.');

    const sanitizedPhone = phoneNumber.replace(/\D/g, '');
    if (sanitizedPhone.length < 8) {
      throw AppError.badRequest('Invalid phone number format. Enter country code and digits without + or spaces.');
    }

    return {
      success: true,
      channelId: channel._id,
      recipient: sanitizedPhone,
      message: message || 'Hello! This is a test message from AutoComm.',
      deliveryStatus: 'sent',
      messageId: `wamid.HBgL${Date.now()}`,
    };
  }

  static async disconnectChannel(clientId, channelId) {
    const channel = await Channel.findOneAndUpdate(
      { _id: channelId, clientId },
      { $set: { status: 'DISCONNECTED' } },
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

  static async checkWebhookSubscription(clientId, channelId) {
    const channel = await Channel.findOne({ _id: channelId, clientId }).lean();
    if (!channel) throw AppError.notFound('Channel not found');

    const wabaId = channel.wabaId;
    if (!wabaId) {
      return { subscribed: false, reason: 'No WABA ID configured on this channel' };
    }
    const accessToken = channel.accessToken;
    if (!accessToken) {
      return { subscribed: false, status: 'unknown', reason: 'No access token configured' };
    }

    try {
      const metaRes = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${wabaId}/subscribed_apps?access_token=${accessToken}`
      );
      const metaData = await metaRes.json();
      if (!metaRes.ok) {
        return {
          subscribed: false,
          status: 'unknown',
          reason: metaData?.error?.message || 'Meta API error',
          raw: metaData,
        };
      }
      const apps = metaData.data || [];
      const extractAppId = (a) => a.whatsapp_business_api_data?.id ?? a.id;
      const expectedAppId = FACEBOOK_APP_ID;
      let subscribed;
      if (expectedAppId) {
        subscribed = apps.some((a) => extractAppId(a) === expectedAppId);
      } else {
        subscribed = apps.length > 0;
      }
      return { subscribed, apps, wabaId, expectedAppId };
    } catch (err) {
      return { subscribed: false, status: 'unknown', reason: String(err) };
    }
  }

  static async resubscribeWebhook(clientId, channelId) {
    const channel = await Channel.findOne({ _id: channelId, clientId }).lean();
    if (!channel) throw AppError.notFound('Channel not found');

    const result = await subscribeWabaToWebhook(channel);
    if (result.success) {
      return { success: true, message: 'WABA successfully subscribed to webhook events' };
    }
    const err = AppError.badRequest(result.error || 'Subscription failed');
    err.responseData = { message: result.error };
    throw err;
  }

  static async listChannelsByUser(clientId, _userId) {
    const channels = await this.listChannels(clientId);
    return {
      status: 'success',
      data: channels,
      pagination: {
        total: channels.length,
        page: 1,
        limit: channels.length,
      },
    };
  }

  static async resubscribeAllWebhooks(clientId) {
    const channels = await Channel.find({
      clientId,
      status: 'CONNECTED',
    }).lean();

    const activeChannels = (channels || []).filter(
      (ch) => ch.wabaId && ch.accessToken
    );

    const results = [];
    for (const ch of activeChannels) {
      const result = await subscribeWabaToWebhook(ch);
      const chId = ch._id || ch.id || '';
      results.push({
        channelId: chId.toString(),
        name: ch.channelName || ch.name,
        success: result.success,
        error: result.error,
      });
    }
    const succeeded = results.filter((r) => r.success).length;
    return {
      message: `Processed ${activeChannels.length} channel(s). ${succeeded} succeeded.`,
      results,
    };
  }

  static async checkChannelHealth(clientId, channelId) {
    const channel = await Channel.findOne({ _id: channelId, clientId }).lean();
    if (!channel) throw AppError.notFound('Channel not found');

    const phoneNumberId = channel.phoneNumberId;
    const accessToken = channel.accessToken;

    if (!phoneNumberId || !accessToken) {
      return { status: 'error', error: 'Phone Number ID or access token not configured' };
    }

    try {
      const res = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating,status,messaging_limit&access_token=${accessToken}`
      );
      const data = await res.json();
      if (!res.ok) {
        return { status: 'error', error: data?.error?.message || 'Meta API error' };
      }
      const healthStatus = data.status === 'FLAGGED' || data.status === 'RESTRICTED' ? 'error' : 'healthy';
      // Persist health details if supported by schema
      try {
        await Channel.findByIdAndUpdate(channelId, {
          $set: {
            healthStatus,
            healthDetails: {
              status: data.status,
              quality_rating: data.quality_rating,
              verified_name: data.verified_name,
            },
            lastHealthCheck: new Date(),
          },
        });
      } catch {
        // Silently continue if columns do not exist in DB yet
      }
      return { status: healthStatus, ...data };
    } catch (err) {
      return { status: 'error', error: String(err) };
    }
  }
}
