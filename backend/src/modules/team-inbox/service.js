import { Conversation, Message } from './model.js';
import { Template } from '../templates/model.js';
import { Channel } from '../channels/model.js';
import { getIO } from '../../socket.js';
import { AppError } from '../../common/errors/app-error.js';
import { logger } from '../../config/logger.js';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export class TeamInboxService {
  /**
   * List conversations with search and filter
   */
  static async listConversations(clientId, filters = {}) {
    const query = { clientId };

    if (filters.status && filters.status !== 'all') {
      query.status = filters.status;
    }

    if (filters.source && filters.source !== 'all') {
      query.source = filters.source;
    }

    if (filters.unreadOnly === true || filters.unreadOnly === 'true') {
      query.unreadCount = { $gt: 0 };
    }

    if (filters.assignedTo && filters.assignedTo !== 'all') {
      query.assignedTo = filters.assignedTo;
    }

    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { contactName: searchRegex },
        { contactPhoneNumber: searchRegex },
        { lastMessageText: searchRegex }
      ];
    }

    return Conversation.find(query)
      .sort({ lastMessageAt: -1 })
      .limit(100);
  }

  /**
   * Get single conversation by ID
   */
  static async getConversation(clientId, conversationId) {
    const conversation = await Conversation.findOne({ _id: conversationId, clientId });
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }
    return conversation;
  }

  /**
   * Get messages for conversation
   */
  static async getMessages(clientId, conversationId) {
    await this.getConversation(clientId, conversationId);
    return Message.find({ clientId, conversationId })
      .sort({ timestamp: 1 })
      .limit(200);
  }

  /**
   * Send outbound message (enforcing 24h window)
   */
  static async sendMessage(clientId, conversationId, { text, templateId, senderName = 'Agent' }) {
    const conversation = await this.getConversation(clientId, conversationId);

    if (conversation.isBlocked) {
      throw new AppError('Cannot send message to a blocked contact', 400);
    }

    const now = Date.now();
    const lastInboundTime = conversation.lastInboundAt ? new Date(conversation.lastInboundAt).getTime() : 0;
    const isWindowExpired = (now - lastInboundTime) > TWENTY_FOUR_HOURS_MS;

    let messageBody = text;
    let messageType = 'text';
    let templateName = '';

    if (templateId) {
      const template = await Template.findOne({ _id: templateId, clientId, type: 'whatsapp' });
      if (!template) {
        throw new AppError('Specified template not found', 404);
      }
      messageType = 'template';
      templateName = template.name;
      messageBody = `[Template: ${template.name}] ${template.bodyText || template.content || ''}`;
    } else {
      if (isWindowExpired && conversation.source === 'WA') {
        throw new AppError(
          'The 24-hour WhatsApp messaging window has expired. You can only send pre-approved template messages.',
          400
        );
      }
      if (!text || !text.trim()) {
        throw new AppError('Message text is required', 400);
      }
    }

    const message = await Message.create({
      clientId,
      conversationId: conversation._id,
      direction: 'outbound',
      senderType: 'agent',
      messageType,
      body: messageBody.trim(),
      templateName,
      status: 'sent',
      timestamp: new Date(),
    });

    conversation.lastMessageText = messageBody.trim();
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Emit realtime updates
    try {
      const io = getIO();
      if (io) {
        io.to(`tenant:${clientId}`).emit('inbox:message', { conversationId: conversation._id, message });
        io.to(`tenant:${clientId}`).emit('inbox:conversation_updated', conversation);
      }
    } catch (err) {
      logger.warn(`Realtime emit failed: ${err.message}`);
    }

    return { conversation, message, isWindowExpired };
  }

  /**
   * Handle incoming message (from Webhook or widget)
   */
  static async handleInboundMessage(clientId, { contactPhoneNumber, contactName, text, source = 'WA', metaMessageId = '' }) {
    let conversation = await Conversation.findOne({ clientId, contactPhoneNumber });

    if (!conversation) {
      conversation = await Conversation.create({
        clientId,
        contactPhoneNumber,
        contactName: contactName || 'Customer',
        source,
        status: 'OPEN',
        assignedTo: 'AutoComm Bot',
        unreadCount: 1,
        lastMessageText: text,
        lastMessageAt: new Date(),
        lastInboundAt: new Date(),
      });
    } else {
      conversation.lastMessageText = text;
      conversation.lastMessageAt = new Date();
      conversation.lastInboundAt = new Date();
      conversation.unreadCount += 1;
      if (conversation.status === 'Resolved') {
        conversation.status = 'OPEN'; // Auto-reopen
      }
      await conversation.save();
    }

    const message = await Message.create({
      clientId,
      conversationId: conversation._id,
      direction: 'inbound',
      senderType: 'contact',
      messageType: 'text',
      body: text,
      status: 'delivered',
      metaMessageId,
      timestamp: new Date(),
    });

    try {
      const io = getIO();
      if (io) {
        io.to(`tenant:${clientId}`).emit('inbox:message', { conversationId: conversation._id, message });
        io.to(`tenant:${clientId}`).emit('inbox:conversation_updated', conversation);
      }
    } catch (err) {
      logger.warn(`Realtime emit failed: ${err.message}`);
    }

    return { conversation, message };
  }

  /**
   * Mark conversation as read
   */
  static async markAsRead(clientId, conversationId) {
    const conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, clientId },
      { $set: { unreadCount: 0 } },
      { new: true }
    );
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }
    return conversation;
  }

  /**
   * Update conversation status (OPEN / Resolved)
   */
  static async updateStatus(clientId, conversationId, status) {
    if (!['OPEN', 'Resolved'].includes(status)) {
      throw new AppError('Invalid status. Must be OPEN or Resolved', 400);
    }
    const conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, clientId },
      { $set: { status } },
      { new: true }
    );
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }
    return conversation;
  }

  /**
   * Assign conversation to user/agent
   */
  static async assignAgent(clientId, conversationId, assignedTo) {
    const conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, clientId },
      { $set: { assignedTo } },
      { new: true }
    );
    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }
    return conversation;
  }

  /**
   * Toggle block contact
   */
  static async toggleBlock(clientId, conversationId) {
    const conversation = await this.getConversation(clientId, conversationId);
    conversation.isBlocked = !conversation.isBlocked;
    await conversation.save();
    return conversation;
  }
}
