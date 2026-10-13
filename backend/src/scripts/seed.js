import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureDatabaseExists } from './init-db.js';
import { connectPostgres, disconnectPostgres, query } from '../config/postgres.js';
import { ROLES, CLIENT_STATUS, USER_STATUS } from '../config/constants.js';
import { hashPassword, encrypt } from '../common/utils/crypto.util.js';
import { logger } from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const seedDatabase = async () => {
  await ensureDatabaseExists();
  logger.info('🌱 Connecting to PostgreSQL to seed platform & tenant demo data...');
  const connected = await connectPostgres();

  if (!connected) {
    logger.error('❌ Could not connect to PostgreSQL. Please check database configuration.');
    process.exit(1);
  }

  // 0. Ensure schema tables exist
  const sqlPath = path.resolve(__dirname, 'schema.sql');
  if (fs.existsSync(sqlPath)) {
    const schemaSql = fs.readFileSync(sqlPath, 'utf8');
    await query(schemaSql);
  }

  try {
    // 1. Super Admin User
    const superAdminCheck = await query('SELECT id FROM users WHERE role = $1 LIMIT 1', [ROLES.SUPER_ADMIN]);
    let superAdminId;

    if (superAdminCheck.rows.length === 0) {
      const superAdminPassword = await hashPassword('SuperAdmin@2026');
      const superAdminRes = await query(
        `INSERT INTO users (client_id, name, email, password_hash, role, status, must_change_password)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [null, 'Root Operator', 'superadmin@autocomm.io', superAdminPassword, ROLES.SUPER_ADMIN, USER_STATUS.ACTIVE, false]
      );
      superAdminId = superAdminRes.rows[0].id;
      logger.info('✅ Super Admin created: superadmin@autocomm.io / SuperAdmin@2026');
    } else {
      superAdminId = superAdminCheck.rows[0].id;
    }

    // 2. Demo Client Company: Capermint Technologies
    const clientCheck = await query('SELECT id FROM clients WHERE client_code = $1 LIMIT 1', ['CLI-1001']);
    let demoClientId;

    if (clientCheck.rows.length === 0) {
      const clientRes = await query(
        `INSERT INTO clients (company_name, client_code, status, plan, contact_number, admin_email, assigned_phone_numbers, credits)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          'Capermint Technologies',
          'CLI-1001',
          CLIENT_STATUS.ACTIVE,
          'Enterprise Scale',
          '+919081044426',
          'alex.vance@autocomm.io',
          JSON.stringify(['+1 (800) 459-2311', '+91 90810 44426']),
          25000.0,
        ]
      );
      demoClientId = clientRes.rows[0].id;
      logger.info('✅ Demo Client created: Capermint Technologies (CLI-1001)');
    } else {
      demoClientId = clientCheck.rows[0].id;
    }

    // 3. Client Admin User: alex.vance@autocomm.io
    const userCheck = await query('SELECT id FROM users WHERE email = $1 LIMIT 1', ['alex.vance@autocomm.io']);
    if (userCheck.rows.length === 0) {
      const clientUserPassword = await hashPassword('ClientAdmin@2026');
      await query(
        `INSERT INTO users (client_id, name, email, password_hash, role, status, must_change_password, contact_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          demoClientId,
          'Alex Vance',
          'alex.vance@autocomm.io',
          clientUserPassword,
          ROLES.ADMIN,
          USER_STATUS.ACTIVE,
          false,
          '+1 (555) 201-4832',
        ]
      );
      logger.info('✅ Client Admin created: alex.vance@autocomm.io / ClientAdmin@2026');
    }

    // 4. WhatsApp Channel
    const channelCheck = await query('SELECT id FROM channels WHERE client_id = $1 LIMIT 1', [demoClientId]);
    let channelId;
    if (channelCheck.rows.length === 0) {
      const channelRes = await query(
        `INSERT INTO channels (client_id, channel_name, phone_number_id, waba_id, access_token, status, webhook_verify_token)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          demoClientId,
          'Capermint WhatsApp Official',
          '102938475610293',
          '827364519283746',
          encrypt('EAAG1234567890abcdef_verified_token'),
          'CONNECTED',
          'autocomm_meta_webhook_secret_token',
        ]
      );
      channelId = channelRes.rows[0].id;
      logger.info('✅ WhatsApp Channel created for Capermint');
    } else {
      channelId = channelCheck.rows[0].id;
    }

    // 5. Contact Groups & Contacts
    const groupCheck = await query('SELECT id FROM groups WHERE client_id = $1 AND name = $2 LIMIT 1', [
      demoClientId,
      'Enterprise VIP Clients',
    ]);
    let groupId;
    if (groupCheck.rows.length === 0) {
      const groupRes = await query(
        `INSERT INTO groups (client_id, name, description, contact_count)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [demoClientId, 'Enterprise VIP Clients', 'High-value customer group for product announcements', 2]
      );
      groupId = groupRes.rows[0].id;
    } else {
      groupId = groupCheck.rows[0].id;
    }

    // Contact 1: Michael Scott
    const contact1Res = await query(
      `INSERT INTO contacts (client_id, name, phone_number, email, custom_variables)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (client_id, phone_number) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [demoClientId, 'Michael Scott', '+1 (555) 928-1029', 'michael.scott@dunder.com', JSON.stringify({ company: 'Dunder Mifflin', city: 'Scranton' })]
    );
    const contact1Id = contact1Res.rows[0].id;

    // Contact 2: Pam Beesly
    const contact2Res = await query(
      `INSERT INTO contacts (client_id, name, phone_number, email, custom_variables)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (client_id, phone_number) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [demoClientId, 'Pam Beesly', '+1 (555) 482-1920', 'pam.beesly@dunder.com', JSON.stringify({ company: 'Dunder Mifflin', city: 'Scranton' })]
    );
    const contact2Id = contact2Res.rows[0].id;

    // Group memberships
    await query(
      `INSERT INTO contact_group_memberships (contact_id, group_id)
       VALUES ($1, $3), ($2, $3)
       ON CONFLICT (contact_id, group_id) DO NOTHING`,
      [contact1Id, contact2Id, groupId]
    );
    logger.info('✅ Seeded Contacts, Groups, and Memberships');

    // 6. Templates
    await query(
      `INSERT INTO templates (client_id, name, category, language, status, body)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT DO NOTHING`,
      [
        demoClientId,
        'order_status_update',
        'UTILITY',
        'en_US',
        'APPROVED',
        'Hello {{1}}, your AutoComm order #{{2}} is now confirmed and in transit!',
      ]
    );
    logger.info('✅ Seeded WhatsApp HSM template');

    // 7. Team Inbox Conversation & Messages
    const convRes = await query(
      `INSERT INTO conversations (client_id, channel_id, channel_name, contact_phone_number, contact_name, status, source, assigned_to, unread_count, last_message_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (client_id, contact_phone_number) DO UPDATE SET last_message_text = EXCLUDED.last_message_text
       RETURNING id`,
      [
        demoClientId,
        channelId,
        'Capermint WhatsApp Official',
        '+1 (555) 928-1029',
        'Michael Scott',
        'OPEN',
        'WA',
        'Alex Vance',
        1,
        'Can you please confirm what time the demo call is scheduled?',
      ]
    );
    const conversationId = convRes.rows[0].id;

    // Messages
    const msgCheck = await query('SELECT id FROM messages WHERE conversation_id = $1 LIMIT 1', [conversationId]);
    if (msgCheck.rows.length === 0) {
      await query(
        `INSERT INTO messages (client_id, conversation_id, direction, sender_type, body, status, timestamp)
         VALUES 
           ($1, $2, 'inbound', 'contact', 'Can you please confirm what time the demo call is scheduled?', 'read', NOW() - INTERVAL '15 minutes'),
           ($1, $2, 'outbound', 'agent', 'Hi Michael! Your demo is confirmed for tomorrow at 2:00 PM EST with our solution architect.', 'delivered', NOW() - INTERVAL '5 minutes')`,
        [demoClientId, conversationId]
      );
      logger.info('✅ Seeded Team Inbox conversation & messages with Michael Scott');
    }

    // 8. Knowledge Base
    const kbCheck = await query('SELECT id FROM knowledge_sources WHERE client_id = $1 LIMIT 1', [demoClientId]);
    if (kbCheck.rows.length === 0) {
      await query(
        `INSERT INTO knowledge_sources (client_id, title, source_type, content, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          demoClientId,
          'AutoComm Platform Service Policy 2026',
          'faq',
          'AutoComm guarantees 99.99% uptime with dual-channel fallback across Meta WhatsApp Cloud API and Neural Voice Calling.',
          'READY',
        ]
      );
      logger.info('✅ Seeded Knowledge Base document');
    }

    // 9. AI Voice Agent & Dedicated Number
    const agentCheck = await query('SELECT id FROM agents WHERE client_id = $1 AND name = $2 LIMIT 1', [
      demoClientId,
      'Rachel (Support Concierge)',
    ]);
    let agentId;
    if (agentCheck.rows.length === 0) {
      const agentRes = await query(
        `INSERT INTO agents (client_id, name, voice_id, voice_name, language, persona, system_prompt, assigned_phone_number, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          demoClientId,
          'Rachel (Support Concierge)',
          'rachel_warm_us',
          'Rachel (Warm & Engaging)',
          'en_US',
          'Warm, professional customer concierge',
          'You are a warm, professional customer concierge. Help customers with their service questions.',
          '+1 (800) 459-2311',
          'ACTIVE',
        ]
      );
      agentId = agentRes.rows[0].id;

      await query(
        `INSERT INTO phone_numbers (client_id, phone_number, provider, friendly_name, assigned_agent_id, status)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [demoClientId, '+1 (800) 459-2311', 'Twilio', 'Toll-Free Customer Concierge', agentId, 'ACTIVE']
      );
      logger.info('✅ Seeded Voice Agent and Dedicated Number');
    } else {
      agentId = agentCheck.rows[0].id;
    }

    // 10. Call Record
    const callCheck = await query('SELECT id FROM call_records WHERE client_id = $1 LIMIT 1', [demoClientId]);
    if (callCheck.rows.length === 0) {
      const transcripts = [
        { speaker: 'agent', text: 'Hello! Thank you for calling Capermint Technologies. How can I assist you today?', timestampSeconds: 2 },
        { speaker: 'user', text: 'Hi Rachel, I needed to check my account billing credits for this month.', timestampSeconds: 10 },
        { speaker: 'agent', text: 'I see your account has 25,000 active credits remaining on your Enterprise plan.', timestampSeconds: 18 },
        { speaker: 'user', text: 'Awesome, that is plenty. Thanks for your help!', timestampSeconds: 24 },
        { speaker: 'agent', text: 'Glad to assist you, Michael! Have a wonderful day. Goodbye!', timestampSeconds: 30 },
      ];

      await query(
        `INSERT INTO call_records (client_id, call_id, agent_id, agent_name, contact_phone_number, contact_name, direction, status, duration_seconds, recording_url, transcripts, summary, sentiment, credits_used)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          demoClientId,
          'call_demo_9821a',
          agentId,
          'Rachel (Support Concierge)',
          '+1 (555) 928-1029',
          'Michael Scott',
          'inbound',
          'COMPLETED',
          114,
          'https://assets.autocomm.io/recordings/sample_call.mp3',
          JSON.stringify(transcripts),
          'Customer called to check remaining enterprise platform credits. Agent verified 25,000 credits available.',
          'Positive',
          0.95,
        ]
      );
      logger.info('✅ Seeded Call Record with transcript');
    }

    // 11. CRM Lead
    const leadCheck = await query('SELECT id FROM crm_leads WHERE client_id = $1 LIMIT 1', [demoClientId]);
    if (leadCheck.rows.length === 0) {
      await query(
        `INSERT INTO crm_leads (client_id, name, phone_number, email, company, stage, deal_value, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          demoClientId,
          'Michael Scott',
          '+1 (555) 928-1029',
          'michael.scott@dunder.com',
          'Dunder Mifflin Paper Co',
          'Qualified',
          4800.0,
          'Customer interested in deploying 5 voice agents for paper sales team.',
        ]
      );
      logger.info('✅ Seeded CRM Lead');
    }

    // 12. Visual Flow
    const flowCheck = await query('SELECT id FROM conversation_flows WHERE client_id = $1 LIMIT 1', [demoClientId]);
    if (flowCheck.rows.length === 0) {
      await query(
        `INSERT INTO conversation_flows (client_id, name, description, channel_type, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [demoClientId, 'Enterprise Inbound Voice Concierge', 'Standard enterprise qualification and calendar demo booking flow', 'voice', 'ACTIVE']
      );
      logger.info('✅ Seeded Conversation Flow');
    }

    // 13. AI Settings
    await query(
      `INSERT INTO ai_settings (client_id, default_provider, openai_model, elevenlabs_voice_id, temperature, max_tokens)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (client_id) DO NOTHING`,
      [demoClientId, 'openai', 'gpt-4o', 'rachel', 0.7, 500]
    );

    logger.info('🎉 All AutoComm demo modules seeded successfully into PostgreSQL!');
  } catch (error) {
    logger.error('❌ Error during PostgreSQL seeding:', error);
    process.exit(1);
  } finally {
    await disconnectPostgres();
  }
};

// Auto-run if invoked directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      logger.error('Seed process failed:', err);
      process.exit(1);
    });
}
