import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { Client } from '../modules/clients/model.js';
import { User } from '../modules/users/model.js';
import { EmailTemplate } from '../modules/email-templates/model.js';
import { Channel } from '../modules/channels/model.js';
import { Contact } from '../modules/contacts/model.js';
import { Group } from '../modules/groups/model.js';
import { Template } from '../modules/templates/model.js';
import { Campaign } from '../modules/campaigns/model.js';
import { Conversation, Message } from '../modules/team-inbox/model.js';
import { KnowledgeSource } from '../modules/knowledge-base/model.js';
import { AiSettings } from '../modules/ai-settings/model.js';
import { Agent } from '../modules/agents/model.js';
import { PhoneNumber } from '../modules/phone-numbers/model.js';
import { CallRecord } from '../modules/calls/model.js';
import { CrmLead } from '../modules/crm/model.js';
import { ConversationFlow } from '../modules/flow-builder/model.js';
import { ROLES, CLIENT_STATUS, USER_STATUS } from '../config/constants.js';
import { hashPassword, encrypt } from '../common/utils/crypto.util.js';
import { logger } from '../config/logger.js';

const seed = async () => {
  await connectDatabase();
  logger.info('🌱 Seeding comprehensive platform & tenant demo data...');

  // 1. Super Admin User
  let superAdmin = await User.findOne({ role: ROLES.SUPER_ADMIN });
  if (!superAdmin) {
    const superAdminPassword = await hashPassword('SuperAdmin@2026');
    superAdmin = await User.create({
      clientId: null,
      name: 'Root Operator',
      email: 'superadmin@autocomm.io',
      passwordHash: superAdminPassword,
      role: ROLES.SUPER_ADMIN,
      status: USER_STATUS.ACTIVE,
      mustChangePassword: false,
    });
    logger.info('✅ Super Admin created: superadmin@autocomm.io / SuperAdmin@2026');
  }

  // 2. Demo Client Company: Capermint Technologies
  let demoClient = await Client.findOne({ clientCode: 'CLI-1001' });
  if (!demoClient) {
    demoClient = await Client.create({
      companyName: 'Capermint Technologies',
      clientCode: 'CLI-1001',
      status: CLIENT_STATUS.ACTIVE,
      plan: 'Enterprise Scale',
      contactNumber: '+919081044426',
      adminEmail: 'alex.vance@autocomm.io',
      assignedPhoneNumbers: ['+1 (800) 459-2311', '+91 90810 44426'],
      credits: 25000,
    });
    logger.info('✅ Demo Client created: Capermint Technologies (CLI-1001)');
  }

  // 3. Client Admin User: alex.vance@autocomm.io
  let clientUser = await User.findOne({ email: 'alex.vance@autocomm.io' });
  if (!clientUser) {
    const clientUserPassword = await hashPassword('ClientAdmin@2026');
    clientUser = await User.create({
      clientId: demoClient._id,
      name: 'Alex Vance',
      email: 'alex.vance@autocomm.io',
      passwordHash: clientUserPassword,
      role: ROLES.ADMIN,
      status: USER_STATUS.ACTIVE,
      mustChangePassword: false,
      contactNumber: '+1 (555) 201-4832',
    });
    logger.info('✅ Client Admin created: alex.vance@autocomm.io / ClientAdmin@2026');
  }

  // 4. WhatsApp Channel
  let channel = await Channel.findOne({ clientId: demoClient._id });
  if (!channel) {
    channel = await Channel.create({
      clientId: demoClient._id,
      channelName: 'Capermint WhatsApp Official',
      phoneNumber: '+919081044426',
      metaAppId: '109283746592817',
      phoneNumberId: '102938475610293',
      wabaId: '827364519283746',
      accessTokenEncrypted: encrypt('EAAG1234567890abcdef_verified_token'),
      status: 'Active',
      health: {
        overall: 'Healthy',
        accountMode: 'LIVE',
        qualityRating: 'GREEN',
        verification: 'VERIFIED',
        nameStatus: 'APPROVED',
      },
      businessProfile: {
        displayName: 'Capermint Technologies Inc',
      },
    });
    logger.info('✅ WhatsApp Channel created for Capermint');
  }

  // 5. Contacts & Group
  let contact1 = await Contact.findOne({ clientId: demoClient._id, phoneNumber: '+1 (555) 928-1029' });
  if (!contact1) {
    contact1 = await Contact.create({
      clientId: demoClient._id,
      name: 'Michael Scott',
      phoneNumber: '+1 (555) 928-1029',
      email: 'michael.scott@dunder.com',
      customVariables: { company: 'Dunder Mifflin', city: 'Scranton' },
    });
    const contact2 = await Contact.create({
      clientId: demoClient._id,
      name: 'Pam Beesly',
      phoneNumber: '+1 (555) 482-1920',
      email: 'pam.beesly@dunder.com',
      customVariables: { company: 'Dunder Mifflin', city: 'Scranton' },
    });

    await Group.create({
      clientId: demoClient._id,
      name: 'Enterprise VIP Clients',
      description: 'High-value customer group for product announcements',
      contactCount: 2,
    });
    logger.info('✅ Seeded Contacts and Group');
  }

  // 6. Templates (WhatsApp & Voice)
  let waTemplate = await Template.findOne({ clientId: demoClient._id, name: 'order_status_update' });
  if (!waTemplate) {
    waTemplate = await Template.create({
      clientId: demoClient._id,
      name: 'order_status_update',
      type: 'whatsapp',
      category: 'UTILITY',
      language: 'en_US',
      status: 'Active',
      metaStatus: 'Approved',
      bodyText: 'Hello {{1}}, your AutoComm order #{{2}} is now confirmed and in transit!',
    });
    await Template.create({
      clientId: demoClient._id,
      name: 'demo_scheduled_call',
      type: 'voice',
      category: 'UTILITY',
      status: 'Active',
      firstMessage: 'Hello, this is AutoComm confirming your personalized demo tomorrow at 2 PM.',
    });
    logger.info('✅ Seeded Meta HSM & Voice templates');
  }

  // 7. Team Inbox Conversation & Messages
  let conversation = await Conversation.findOne({ clientId: demoClient._id, contactPhoneNumber: '+1 (555) 928-1029' });
  if (!conversation) {
    conversation = await Conversation.create({
      clientId: demoClient._id,
      channelId: channel._id,
      channelName: 'Capermint WhatsApp Official',
      contactPhoneNumber: '+1 (555) 928-1029',
      contactName: 'Michael Scott',
      status: 'OPEN',
      source: 'WA',
      assignedTo: 'Alex Vance',
      unreadCount: 1,
      lastMessageText: 'Can you please confirm what time the demo call is scheduled?',
      lastMessageAt: new Date(),
      lastInboundAt: new Date(), // Active within 24h window
    });

    await Message.create({
      clientId: demoClient._id,
      conversationId: conversation._id,
      direction: 'inbound',
      senderType: 'contact',
      body: 'Can you please confirm what time the demo call is scheduled?',
      status: 'read',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
    });

    await Message.create({
      clientId: demoClient._id,
      conversationId: conversation._id,
      direction: 'outbound',
      senderType: 'agent',
      body: 'Hi Michael! Your demo is confirmed for tomorrow at 2:00 PM EST with our solution architect.',
      status: 'delivered',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
    });
    logger.info('✅ Seeded Team Inbox conversation with Michael Scott');
  }

  // 8. Knowledge Base
  let kbSource = await KnowledgeSource.findOne({ clientId: demoClient._id });
  if (!kbSource) {
    await KnowledgeSource.create({
      clientId: demoClient._id,
      title: 'AutoComm Platform Service Policy 2026',
      type: 'text',
      content: 'AutoComm guarantees 99.99% uptime with dual-channel fallback across Meta WhatsApp Cloud API and Neural Voice Calling.',
      characterCount: 125,
      status: 'INDEXED',
    });
    logger.info('✅ Seeded Knowledge Base document');
  }

  // 9. AI Voice Agent & Dedicated Number
  let agent = await Agent.findOne({ clientId: demoClient._id, name: 'Rachel (Support Concierge)' });
  if (!agent) {
    agent = await Agent.create({
      clientId: demoClient._id,
      name: 'Rachel (Support Concierge)',
      type: 'incoming',
      voiceId: 'rachel_warm_us',
      voiceName: 'Rachel (Warm & Engaging)',
      language: 'en-US',
      greetingMessage: 'Hello! Thank you for calling Capermint Technologies. How can I assist you today?',
      systemPrompt: 'You are a warm, professional customer concierge. Help customers with their service questions.',
      assignedPhoneNumber: '+1 (800) 459-2311',
      status: 'ACTIVE',
    });

    await PhoneNumber.create({
      clientId: demoClient._id,
      phoneNumber: '+1 (800) 459-2311',
      friendlyName: 'Toll-Free Customer Concierge',
      country: 'US',
      type: 'Toll-Free',
      status: 'ACTIVE',
      assignedAgentId: agent._id,
      assignedAgentName: agent.name,
      monthlyRate: 15.0,
    });
    logger.info('✅ Seeded Voice Agent and Dedicated Number');
  }

  // 10. Call Record
  let call = await CallRecord.findOne({ clientId: demoClient._id });
  if (!call) {
    await CallRecord.create({
      clientId: demoClient._id,
      callId: 'call_demo_9821a',
      agentId: agent?._id || null,
      agentName: 'Rachel (Support Concierge)',
      contactPhoneNumber: '+1 (555) 928-1029',
      contactName: 'Michael Scott',
      direction: 'inbound',
      status: 'COMPLETED',
      durationSeconds: 114,
      recordingUrl: 'https://assets.autocomm.io/recordings/sample_call.mp3',
      transcript: [
        { speaker: 'agent', text: 'Hello! Thank you for calling Capermint Technologies. How can I assist you today?', timestampSeconds: 2 },
        { speaker: 'user', text: 'Hi Rachel, I needed to check my account billing credits for this month.', timestampSeconds: 10 },
        { speaker: 'agent', text: 'I see your account has 25,000 active credits remaining on your Enterprise plan.', timestampSeconds: 18 },
        { speaker: 'user', text: 'Awesome, that is plenty. Thanks for your help!', timestampSeconds: 24 },
        { speaker: 'agent', text: 'Glad to assist you, Michael! Have a wonderful day. Goodbye!', timestampSeconds: 30 },
      ],
      aiSummary: 'Customer called to check remaining enterprise platform credits. Agent verified 25,000 credits available.',
      sentiment: 'Positive',
      costCredits: 0.95,
      callDate: new Date(),
    });
    logger.info('✅ Seeded Call Record with transcript');
  }

  // 11. Quick CRM Lead
  let lead = await CrmLead.findOne({ clientId: demoClient._id });
  if (!lead) {
    await CrmLead.create({
      clientId: demoClient._id,
      contactName: 'Michael Scott',
      phoneNumber: '+1 (555) 928-1029',
      email: 'michael.scott@dunder.com',
      stage: 'QUALIFIED',
      dealValue: 4800,
      source: 'AgentLab Call',
      assignedTo: 'Alex Vance',
      sentiment: 'Positive',
      tags: ['Enterprise Deal', 'Priority'],
      notes: 'Customer interested in deploying 5 voice agents for paper sales team.',
    });
    logger.info('✅ Seeded Quick CRM pipeline lead');
  }

  // 12. Super Admin Visual Flow Template
  let flow = await ConversationFlow.findOne({ name: 'Enterprise Inbound Voice Concierge' });
  if (!flow) {
    await ConversationFlow.create({
      name: 'Enterprise Inbound Voice Concierge',
      description: 'Standard enterprise qualification and calendar demo booking flow',
      assignedClientId: demoClient._id,
      assignedClientName: 'Capermint Technologies',
      isPublished: true,
    });
    logger.info('✅ Seeded Visual Flow tree');
  }

  logger.info('🎉 All 12 platform demo modules seeded successfully!');
  await disconnectDatabase();
  process.exit(0);
};

seed().catch((err) => {
  logger.error('Error during seeding:', err);
  process.exit(1);
});
