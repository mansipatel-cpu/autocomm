-- =====================================================================
-- AutoComm PostgreSQL Demo Data Seed Script
-- =====================================================================

-- 1. Super Admin User (Password: SuperAdmin@2026)
INSERT INTO users (client_id, name, email, password_hash, role, status, must_change_password)
VALUES (
    NULL,
    'Root Operator',
    'superadmin@autocomm.io',
    '$2a$10$tJ9fFjT.s8yXbB4.c9P01uG5o4hL6E7l9m8k7j6h5g4f3e2d1c0ba',
    'Super Admin',
    'active',
    FALSE
) ON CONFLICT DO NOTHING;

-- 2. Demo Client Company
INSERT INTO clients (company_name, client_code, status, plan, contact_number, admin_email, assigned_phone_numbers, credits)
VALUES (
    'Capermint Technologies',
    'CLI-1001',
    'active',
    'Enterprise Scale',
    '+919081044426',
    'alex.vance@autocomm.io',
    '["+1 (800) 459-2311", "+91 90810 44426"]'::jsonb,
    25000.00
) ON CONFLICT (client_code) DO NOTHING;

-- 3. Client Admin User (Password: ClientAdmin@2026)
INSERT INTO users (client_id, name, email, password_hash, role, status, must_change_password, contact_number)
SELECT 
    c.id,
    'Alex Vance',
    'alex.vance@autocomm.io',
    '$2a$10$uK8fEkS.r7xXaA3.b8O90tF4n3gK5D6k8l7j6i5h4g3f2e1d0b9za',
    'Admin',
    'active',
    FALSE,
    '+1 (555) 201-4832'
FROM clients c WHERE c.client_code = 'CLI-1001'
ON CONFLICT (email, client_id) DO NOTHING;

-- 4. WhatsApp Channel
INSERT INTO channels (client_id, channel_name, phone_number_id, waba_id, access_token, status, webhook_verify_token)
SELECT 
    c.id,
    'Capermint WhatsApp Official',
    '102938475610293',
    '827364519283746',
    'EAAG1234567890abcdef_verified_token',
    'CONNECTED',
    'autocomm_meta_webhook_secret_token'
FROM clients c WHERE c.client_code = 'CLI-1001'
LIMIT 1;

-- 5. Contact Groups
INSERT INTO groups (client_id, name, description, contact_count)
SELECT 
    c.id,
    'Enterprise VIP Clients',
    'High-value customer group for product announcements',
    2
FROM clients c WHERE c.client_code = 'CLI-1001'
LIMIT 1;

-- 6. Contacts
INSERT INTO contacts (client_id, name, phone_number, email, custom_variables)
SELECT 
    c.id,
    'Michael Scott',
    '+1 (555) 928-1029',
    'michael.scott@dunder.com',
    '{"company": "Dunder Mifflin", "city": "Scranton"}'::jsonb
FROM clients c WHERE c.client_code = 'CLI-1001'
ON CONFLICT (client_id, phone_number) DO NOTHING;

INSERT INTO contacts (client_id, name, phone_number, email, custom_variables)
SELECT 
    c.id,
    'Pam Beesly',
    '+1 (555) 482-1920',
    'pam.beesly@dunder.com',
    '{"company": "Dunder Mifflin", "city": "Scranton"}'::jsonb
FROM clients c WHERE c.client_code = 'CLI-1001'
ON CONFLICT (client_id, phone_number) DO NOTHING;

-- 7. Group Memberships
INSERT INTO contact_group_memberships (contact_id, group_id)
SELECT ct.id, gr.id
FROM contacts ct, groups gr, clients c
WHERE c.client_code = 'CLI-1001' 
  AND ct.client_id = c.id 
  AND gr.client_id = c.id
  AND gr.name = 'Enterprise VIP Clients'
ON CONFLICT DO NOTHING;

-- 8. WhatsApp HSM Template
INSERT INTO templates (client_id, name, category, language, status, body)
SELECT 
    c.id,
    'order_status_update',
    'UTILITY',
    'en_US',
    'APPROVED',
    'Hello {{1}}, your AutoComm order #{{2}} is now confirmed and in transit!'
FROM clients c WHERE c.client_code = 'CLI-1001';

-- 9. Team Inbox Conversation & Messages
INSERT INTO conversations (client_id, channel_name, contact_phone_number, contact_name, status, source, assigned_to, unread_count, last_message_text)
SELECT 
    c.id,
    'Capermint WhatsApp Official',
    '+1 (555) 928-1029',
    'Michael Scott',
    'OPEN',
    'WA',
    'Alex Vance',
    1,
    'Can you please confirm what time the demo call is scheduled?'
FROM clients c WHERE c.client_code = 'CLI-1001'
ON CONFLICT (client_id, contact_phone_number) DO NOTHING;

INSERT INTO messages (client_id, conversation_id, direction, sender_type, body, status, timestamp)
SELECT 
    c.id,
    conv.id,
    'inbound',
    'contact',
    'Can you please confirm what time the demo call is scheduled?',
    'read',
    NOW() - INTERVAL '15 minutes'
FROM clients c 
JOIN conversations conv ON conv.client_id = c.id
WHERE c.client_code = 'CLI-1001' AND conv.contact_phone_number = '+1 (555) 928-1029';

INSERT INTO messages (client_id, conversation_id, direction, sender_type, body, status, timestamp)
SELECT 
    c.id,
    conv.id,
    'outbound',
    'agent',
    'Hi Michael! Your demo is confirmed for tomorrow at 2:00 PM EST with our solution architect.',
    'delivered',
    NOW() - INTERVAL '5 minutes'
FROM clients c 
JOIN conversations conv ON conv.client_id = c.id
WHERE c.client_code = 'CLI-1001' AND conv.contact_phone_number = '+1 (555) 928-1029';

-- 10. AI Voice Agent & Dedicated Number
INSERT INTO agents (client_id, name, voice_id, voice_name, language, persona, system_prompt, assigned_phone_number, status)
SELECT 
    c.id,
    'Rachel (Support Concierge)',
    'rachel_warm_us',
    'Rachel (Warm & Engaging)',
    'en_US',
    'Warm, professional customer concierge',
    'You are a warm, professional customer concierge. Help customers with their service questions.',
    '+1 (800) 459-2311',
    'ACTIVE'
FROM clients c WHERE c.client_code = 'CLI-1001';

INSERT INTO phone_numbers (client_id, phone_number, provider, friendly_name, assigned_agent_id, status)
SELECT 
    c.id,
    '+1 (800) 459-2311',
    'Twilio',
    'Toll-Free Customer Concierge',
    ag.id,
    'ACTIVE'
FROM clients c 
JOIN agents ag ON ag.client_id = c.id
WHERE c.client_code = 'CLI-1001' AND ag.name = 'Rachel (Support Concierge)';

-- 11. Call Record
INSERT INTO call_records (client_id, call_id, agent_name, contact_phone_number, contact_name, direction, status, duration_seconds, recording_url, transcripts, summary, sentiment, credits_used)
SELECT 
    c.id,
    'call_demo_9821a',
    'Rachel (Support Concierge)',
    '+1 (555) 928-1029',
    'Michael Scott',
    'inbound',
    'COMPLETED',
    114,
    'https://assets.autocomm.io/recordings/sample_call.mp3',
    '[
        {"speaker": "agent", "text": "Hello! Thank you for calling Capermint Technologies. How can I assist you today?", "timestampSeconds": 2},
        {"speaker": "user", "text": "Hi Rachel, I needed to check my account billing credits for this month.", "timestampSeconds": 10},
        {"speaker": "agent", "text": "I see your account has 25,000 active credits remaining on your Enterprise plan.", "timestampSeconds": 18},
        {"speaker": "user", "text": "Awesome, that is plenty. Thanks for your help!", "timestampSeconds": 24},
        {"speaker": "agent", "text": "Glad to assist you, Michael! Have a wonderful day. Goodbye!", "timestampSeconds": 30}
    ]'::jsonb,
    'Customer called to check remaining enterprise platform credits. Agent verified 25,000 credits available.',
    'Positive',
    0.95
FROM clients c WHERE c.client_code = 'CLI-1001';

-- 12. CRM Lead
INSERT INTO crm_leads (client_id, name, phone_number, email, company, stage, deal_value, notes)
SELECT 
    c.id,
    'Michael Scott',
    '+1 (555) 928-1029',
    'michael.scott@dunder.com',
    'Dunder Mifflin Paper Co',
    'Qualified',
    4800.00,
    'Customer interested in deploying 5 voice agents for paper sales team.'
FROM clients c WHERE c.client_code = 'CLI-1001';

-- 13. Knowledge Source
INSERT INTO knowledge_sources (client_id, title, source_type, content, status)
SELECT 
    c.id,
    'AutoComm Platform Service Policy 2026',
    'faq',
    'AutoComm guarantees 99.99% uptime with dual-channel fallback across Meta WhatsApp Cloud API and Neural Voice Calling.',
    'READY'
FROM clients c WHERE c.client_code = 'CLI-1001';

-- 14. Conversation Flow
INSERT INTO conversation_flows (client_id, name, description, channel_type, status)
SELECT 
    c.id,
    'Enterprise Inbound Voice Concierge',
    'Standard enterprise qualification and calendar demo booking flow',
    'voice',
    'ACTIVE'
FROM clients c WHERE c.client_code = 'CLI-1001';

-- 15. AI Settings
INSERT INTO ai_settings (client_id, default_provider, openai_model, elevenlabs_voice_id, temperature, max_tokens)
SELECT 
    c.id,
    'openai',
    'gpt-4o',
    'rachel',
    0.70,
    500
FROM clients c WHERE c.client_code = 'CLI-1001'
ON CONFLICT (client_id) DO NOTHING;
