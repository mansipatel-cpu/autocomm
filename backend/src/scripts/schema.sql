-- =====================================================================
-- AutoComm PostgreSQL Relational Database Schema
-- Multi-Tenant Architecture & Omnichannel Messaging / Voice AI Platform
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Clients (Tenants)
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    client_code VARCHAR(64) UNIQUE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    plan VARCHAR(64) NOT NULL DEFAULT 'Enterprise Scale',
    contact_number VARCHAR(64) NOT NULL,
    admin_email VARCHAR(255) NOT NULL,
    admin_name VARCHAR(255),
    assigned_phone_numbers JSONB DEFAULT '[]'::jsonb,
    credits NUMERIC(14, 2) NOT NULL DEFAULT 10000.00,
    settings JSONB NOT NULL DEFAULT '{
        "defaultLanguage": "en_US",
        "maxConcurrentCalls": 25,
        "timezone": "America/New_York",
        "enableAutoRetry": true
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_client_code ON clients(client_code);

-- 2. Users (Platform Super Admins and Tenant Users)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(64) NOT NULL DEFAULT 'Admin Operator',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    contact_number VARCHAR(64),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_users_email_client UNIQUE (email, client_id)
);

CREATE INDEX IF NOT EXISTS idx_users_client_id ON users(client_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- 3. Channels (WhatsApp Meta Cloud API Channels)
CREATE TABLE IF NOT EXISTS channels (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    channel_name VARCHAR(255) NOT NULL DEFAULT 'capermint',
    phone_number_id VARCHAR(128),
    waba_id VARCHAR(128),
    access_token TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'CONNECTED',
    webhook_verify_token VARCHAR(255),
    health_status VARCHAR(32) DEFAULT 'unknown',
    health_details JSONB DEFAULT '{}'::jsonb,
    last_health_check TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_channels_client_id ON channels(client_id);

-- 4. Contact Groups (Audiences)
CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    contact_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groups_client_id ON groups(client_id);

-- 5. Contacts
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT '',
    phone_number VARCHAR(64) NOT NULL,
    whatsapp_number VARCHAR(64) DEFAULT '',
    channels JSONB NOT NULL DEFAULT '["whatsapp", "voice"]'::jsonb,
    status VARCHAR(32) NOT NULL DEFAULT 'Active',
    custom_variables JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_contact_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_contacts_client_phone UNIQUE (client_id, phone_number)
);

CREATE INDEX IF NOT EXISTS idx_contacts_client_id ON contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);

-- 6. Contact Group Memberships (Many-to-Many)
CREATE TABLE IF NOT EXISTS contact_group_memberships (
    contact_id INT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    group_id INT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (contact_id, group_id)
);

-- 7. WhatsApp HSM Templates
CREATE TABLE IF NOT EXISTS templates (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL DEFAULT 'MARKETING',
    language VARCHAR(32) NOT NULL DEFAULT 'en_US',
    status VARCHAR(32) NOT NULL DEFAULT 'APPROVED',
    header JSONB DEFAULT '{}'::jsonb,
    body TEXT NOT NULL,
    footer TEXT DEFAULT '',
    buttons JSONB DEFAULT '[]'::jsonb,
    meta_template_id VARCHAR(128) DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_client_id ON templates(client_id);

-- 8. Voice AI Agents
CREATE TABLE IF NOT EXISTS agents (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    voice_id VARCHAR(128) NOT NULL DEFAULT 'rachel',
    voice_name VARCHAR(128) NOT NULL DEFAULT 'Rachel (Neural US)',
    language VARCHAR(32) NOT NULL DEFAULT 'en_US',
    persona TEXT DEFAULT '',
    system_prompt TEXT DEFAULT '',
    temperature NUMERIC(3, 2) NOT NULL DEFAULT 0.70,
    first_message TEXT DEFAULT 'Hello! How can I help you today?',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    assigned_phone_number VARCHAR(64) DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agents_client_id ON agents(client_id);

-- 9. Campaigns (Whatway WhatsApp & AgentLab Auto Calling)
CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    campaign_code VARCHAR(64) NOT NULL,
    channel_type VARCHAR(64) NOT NULL, -- 'whatsapp' | 'voice'
    campaign_type VARCHAR(64) NOT NULL DEFAULT 'Marketing',
    description TEXT DEFAULT '',
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    
    -- WhatsApp options
    template_id INT REFERENCES templates(id) ON DELETE SET NULL,
    template_name VARCHAR(255) DEFAULT '',
    language VARCHAR(32) DEFAULT 'en_US',
    enable_auto_retry BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Voice AI options
    agent_id INT REFERENCES agents(id) ON DELETE SET NULL,
    agent_name VARCHAR(255) DEFAULT '',
    phone_number VARCHAR(64) DEFAULT '',
    visual_flow_name VARCHAR(255) DEFAULT '',
    custom_script TEXT DEFAULT '',
    campaign_goal VARCHAR(255) DEFAULT '',
    call_scheduling JSONB NOT NULL DEFAULT '{
        "enabled": false,
        "startTime": "09:00 AM",
        "endTime": "05:00 PM",
        "daysOfWeek": ["Mon", "Tue", "Wed", "Thu", "Fri"],
        "timezone": "America/New_York (EST, UTC-5)"
    }'::jsonb,
    
    -- Audience & Execution
    target_group_ids JSONB DEFAULT '[]'::jsonb,
    audience_segment_name VARCHAR(255) DEFAULT 'All Targeted Contacts',
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Metrics
    metrics JSONB NOT NULL DEFAULT '{
        "totalRecipients": 0,
        "sent": 0,
        "delivered": 0,
        "read": 0,
        "answered": 0,
        "failed": 0,
        "progressPercent": 0
    }'::jsonb,
    
    -- Soft Deletion
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    deleted_by INT REFERENCES users(id) ON DELETE SET NULL,
    deleted_by_user_name VARCHAR(255) DEFAULT 'Admin User',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_client_id ON campaigns(client_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_channel_type ON campaigns(channel_type);

-- 10. Campaign Recipients
CREATE TABLE IF NOT EXISTS campaign_recipients (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    campaign_id INT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    name VARCHAR(255) DEFAULT 'Recipient',
    phone_number VARCHAR(64) NOT NULL,
    email VARCHAR(255) DEFAULT '',
    language VARCHAR(32) DEFAULT 'en',
    city VARCHAR(128) DEFAULT '',
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    error_details TEXT DEFAULT '',
    custom_variables JSONB DEFAULT '{}'::jsonb,
    dispatched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipients_campaign_id ON campaign_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_recipients_status ON campaign_recipients(status);

-- 11. Team Inbox Conversations
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    channel_id INT REFERENCES channels(id) ON DELETE SET NULL,
    channel_name VARCHAR(255) DEFAULT 'capermint',
    contact_phone_number VARCHAR(64) NOT NULL,
    contact_name VARCHAR(255) DEFAULT 'Customer',
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    source VARCHAR(32) NOT NULL DEFAULT 'WA',
    assigned_to VARCHAR(255) DEFAULT 'AutoComm Bot',
    unread_count INT NOT NULL DEFAULT 0,
    last_message_text TEXT DEFAULT '',
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_inbound_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_conversations_client_phone UNIQUE (client_id, contact_phone_number)
);

CREATE INDEX IF NOT EXISTS idx_conversations_client_id ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

-- 12. Team Inbox Messages
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    conversation_id INT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    direction VARCHAR(32) NOT NULL, -- 'inbound' | 'outbound'
    sender_type VARCHAR(32) NOT NULL DEFAULT 'contact', -- 'contact' | 'agent' | 'bot'
    message_type VARCHAR(32) NOT NULL DEFAULT 'text', -- 'text' | 'template' | 'image' | 'document'
    body TEXT NOT NULL,
    template_name VARCHAR(255) DEFAULT '',
    status VARCHAR(32) NOT NULL DEFAULT 'delivered',
    meta_message_id VARCHAR(255) DEFAULT '',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);

-- 13. Phone Numbers
CREATE TABLE IF NOT EXISTS phone_numbers (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES clients(id) ON DELETE SET NULL,
    phone_number VARCHAR(64) NOT NULL,
    provider VARCHAR(64) NOT NULL DEFAULT 'Twilio',
    friendly_name VARCHAR(255) DEFAULT '',
    country VARCHAR(32) DEFAULT 'US',
    type VARCHAR(32) DEFAULT 'Local',
    monthly_rate NUMERIC(10, 2) DEFAULT 15.00,
    forwarding_number VARCHAR(64) DEFAULT '',
    fallback_number VARCHAR(64) DEFAULT '',
    assigned_agent_id INT REFERENCES agents(id) ON DELETE SET NULL,
    assigned_agent_name VARCHAR(255) DEFAULT 'Unassigned',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    capabilities JSONB NOT NULL DEFAULT '{"voice": true, "sms": true}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone_numbers_client_id ON phone_numbers(client_id);

-- 14. Call Records
CREATE TABLE IF NOT EXISTS call_records (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    call_id VARCHAR(128) NOT NULL,
    agent_id INT REFERENCES agents(id) ON DELETE SET NULL,
    agent_name VARCHAR(255) DEFAULT 'Rachel (AgentLab)',
    contact_phone_number VARCHAR(64) NOT NULL,
    contact_name VARCHAR(255) DEFAULT 'Customer',
    direction VARCHAR(32) NOT NULL DEFAULT 'outbound',
    status VARCHAR(32) NOT NULL DEFAULT 'COMPLETED',
    duration_seconds INT NOT NULL DEFAULT 0,
    recording_url TEXT DEFAULT '',
    sentiment VARCHAR(32) DEFAULT 'Neutral',
    summary TEXT DEFAULT '',
    transcripts JSONB DEFAULT '[]'::jsonb,
    credits_used NUMERIC(10, 2) NOT NULL DEFAULT 1.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_call_records_client_id ON call_records(client_id);
CREATE INDEX IF NOT EXISTS idx_call_records_call_id ON call_records(call_id);
CREATE INDEX IF NOT EXISTS idx_call_records_status ON call_records(status);

-- 15. CRM Leads
CREATE TABLE IF NOT EXISTS crm_leads (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT '',
    phone_number VARCHAR(64) NOT NULL,
    company VARCHAR(255) DEFAULT '',
    stage VARCHAR(64) NOT NULL DEFAULT 'New Lead',
    deal_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    notes TEXT DEFAULT '',
    custom_fields JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_leads_client_id ON crm_leads(client_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_stage ON crm_leads(stage);

-- 16. Conversation Flows (Decision Tree Builder)
CREATE TABLE IF NOT EXISTS conversation_flows (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES clients(id) ON DELETE SET NULL,
    assigned_client_id INT REFERENCES clients(id) ON DELETE SET NULL,
    assigned_client_name VARCHAR(255) DEFAULT 'Global System Template',
    voice_agent_id INT REFERENCES agents(id) ON DELETE SET NULL,
    voice_agent_name VARCHAR(255) DEFAULT '',
    assigned_phone_number VARCHAR(64) DEFAULT '',
    effective_date TIMESTAMPTZ DEFAULT NOW(),
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    channel_type VARCHAR(64) NOT NULL DEFAULT 'voice',
    nodes JSONB NOT NULL DEFAULT '[]'::jsonb,
    edges JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_flows_client_id ON conversation_flows(client_id);
CREATE INDEX IF NOT EXISTS idx_conversation_flows_assigned_client_id ON conversation_flows(assigned_client_id);

-- 17. Knowledge Sources (RAG Vector / Knowledge Base)
CREATE TABLE IF NOT EXISTS knowledge_sources (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    source_type VARCHAR(64) NOT NULL DEFAULT 'faq',
    content TEXT NOT NULL,
    file_url TEXT DEFAULT '',
    status VARCHAR(32) NOT NULL DEFAULT 'READY',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_sources_client_id ON knowledge_sources(client_id);

-- 18. AI Tenant Settings
CREATE TABLE IF NOT EXISTS ai_settings (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE UNIQUE,
    default_provider VARCHAR(64) NOT NULL DEFAULT 'openai',
    openai_model VARCHAR(64) NOT NULL DEFAULT 'gpt-4o',
    elevenlabs_voice_id VARCHAR(128) NOT NULL DEFAULT 'rachel',
    temperature NUMERIC(3, 2) NOT NULL DEFAULT 0.70,
    max_tokens INT NOT NULL DEFAULT 500,
    sentiment_analysis_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    call_recording_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    auto_transcribe BOOLEAN NOT NULL DEFAULT TRUE,
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. API Keys
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    client_id INT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(32) NOT NULL,
    permissions JSONB NOT NULL DEFAULT '["*"]'::jsonb,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_client_id ON api_keys(client_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix);

-- 20. Email Templates
CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    client_id INT REFERENCES clients(id) ON DELETE CASCADE, -- NULL for system templates
    slug VARCHAR(128) NOT NULL,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    html_body TEXT,
    body_html TEXT,
    text_body TEXT DEFAULT '',
    variables JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_templates_client_id ON email_templates(client_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_slug ON email_templates(slug);

-- 21. Analytics Scripts
CREATE TABLE IF NOT EXISTS analytics_scripts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(64) DEFAULT 'custom' NOT NULL,
    code TEXT,
    head_code TEXT,
    body_code TEXT,
    placement TEXT[] DEFAULT ARRAY['head']::TEXT[] NOT NULL,
    load_priority INTEGER DEFAULT 0 NOT NULL,
    async BOOLEAN DEFAULT false,
    defer BOOLEAN DEFAULT false,
    enabled BOOLEAN DEFAULT true NOT NULL,
    hide_on_internal_pages BOOLEAN DEFAULT false NOT NULL,
    description TEXT,
    updated_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Super Admin Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id VARCHAR(64),
    admin_email VARCHAR(255),
    action VARCHAR(64) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(128),
    details JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- 22. Incoming Connections
CREATE TABLE IF NOT EXISTS incoming_connections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(64) NOT NULL DEFAULT 'Twilio',
    client_id INT REFERENCES clients(id) ON DELETE SET NULL,
    phone_number VARCHAR(64) DEFAULT '',
    webhook_url TEXT DEFAULT '',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    logs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incoming_connections_client_id ON incoming_connections(client_id);
CREATE INDEX IF NOT EXISTS idx_incoming_connections_status ON incoming_connections(status);


