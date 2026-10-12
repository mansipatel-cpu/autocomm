# AutoComm - Architectural & Functional Assumptions

This document records all functional and architectural assumptions made where the specification or Figma document indicates an item is "not clearly defined in the Figma" or where implementation details require pragmatic engineering choices.

---

## 1. Multi-Tenancy & Tenant Isolation
- **Tenant Scope:** Every tenant-owned MongoDB model includes an indexed `clientId` field (ObjectId reference to `Client`).
- **Middleware Enforcement:** The client API middleware extracts `clientId` from the verified JWT (or API Key) and automatically scopes all database queries (`{ clientId: req.user.clientId }`).
- **Super Admin Bypass:** Super Admin endpoints (`/api/v1/superadmin/*`) operate across tenants and can inspect or manage records for any client by specifying `clientId` in query filters or path parameters.
- **Client Provisioning:** When a Super Admin creates a client, the system generates an initial Admin user, assigns a default password (forced change on first login flag `mustChangePassword: true`), sends the credentials via email using the `Client Credential Email` template, and sets initial default credits and settings.

---

## 2. Authentication & Roles
- **Client Roles:**
  - `Admin`: Full access to the client workspace, settings, campaigns, templates, agents, channels, and team inbox.
  - `System Admin`: Access to system configuration, channels, AI settings, knowledge base, and phone numbers.
  - `Admin Operator`: Operates campaigns, templates, contacts, groups, calls, and CRM.
  - `Inbox Agent`: Restricted to Team Inbox conversations, customer details view, and contact note management.
- **Super Admin:** Dedicated role with a distinct JWT secret, distinct audience (`autocomm:superadmin`), and distinct login route (`/api/v1/superadmin/auth/login`).
- **First Login & Password Reset:** 
  - For client users created with generated credentials, `mustChangePassword: true` triggers a prompt to set a new password before accessing the dashboard.
  - A secure token-based forgot password endpoint (`/api/v1/auth/forgot-password` and `/api/v1/auth/reset-password`) is implemented using Nodemailer email dispatch.
- **Remember Me (30 Days):** Issues a refresh token with a 30-day expiry when selected; otherwise standard 24-hour expiry.

---

## 3. Campaigns (WhatsApp & Auto Calling)
- **Status Lifecycle:** `Draft` -> `Scheduled` -> `Ongoing` (dispatching) -> `Completed` (or `Failed`, `Paused`).
- **Soft Deletion & 30-Day Purge:**
  - Deleting a campaign sets `deletedAt: new Date()` and `isDeleted: true`.
  - Deleted campaigns appear in the "Deleted Campaigns" tab with an auto-purge countdown (calculated as `30 - days_since_deletion`).
  - A BullMQ scheduled cron worker runs daily to permanently remove campaigns where `deletedAt <= 30 days ago`.
  - Restoring a campaign clears `deletedAt` and restores its previous status.
- **Execution Engine:** Campaigns never execute synchronously inside HTTP requests. Creation or start triggers a BullMQ queue job (`campaign-dispatch`). The worker batches dispatches according to rate limits, checks channel health, and updates recipient progress (`sent`, `delivered`, `failed`).
- **Auto-retry Fallback:** When `Enable auto-retry for failed messages` is toggled on, messages that fail delivery are pushed to a retry queue with exponential backoff / alternative dispatch after a 15-minute window.

---

## 4. Templates (Whatway WhatsApp & AgentLab Voice)
- **Whatway Templates:**
  - Validated against Meta HSM guidelines: lowercase alphanumeric + underscores only for name; sequential variables `{{1}}`, `{{2}}`, `{{3}}`; header max 60 chars; body max 1024 chars; footer max 60 chars; up to 3 buttons.
  - Stored with `metaStatus`: `Approved`, `In Review`, or `Draft`. Meta sync endpoint allows polling or webhook-driven status synchronization.
- **AgentLab Voice Templates:**
  - Name format: lowercase alphanumeric + underscores only.
  - First Message max 300 characters.
  - Configurable Voice Tone (`Professional`, `Empathetic`, `Urgent`, `Friendly`) and Personality (`Financial Advisor`, `Support Specialist`, `Compliance Officer`).

---

## 5. Contacts & Groups
- **Bulk Actions:**
  - "Add to group": Adds currently selected contacts to an existing group.
  - "Add Group" (Create Group): Opens the create group workflow pre-populating selected contacts.
- **Contact Duplication:** Contacts are unique per tenant by `phoneNumber`. Adding an existing phone number updates the contact or returns a duplicate notification.
- **CSV Import/Export:**
  - Standard UTF-8 CSV parsing for phone numbers, names, emails, and dynamic custom variables.
  - Sample CSV templates generated on demand.

---

## 6. Channels & Settings Navigation
- **Navigation & Settings Tabs:** As confirmed by the Figma and sidebar layout, the sidebar contains a single **Settings** item at the bottom. Navigating to `/settings` opens the unified configuration view featuring two main top tabs:
  - **Tab 1: Channel Settings** (WhatsApp channels, SMS Gateways placeholder, Webhooks & API, credentials, health monitoring, test messages, profile, display name change, disconnect/delete).
  - **Tab 2: AI Settings** (AI Model Provider, Training Data URLs/docs, Q&A Pairs, AI Behavior, Escalation Rules, Test Chat, Data Preview).
- **Team Inbox in Sidebar:** Located under the collapsible **Messages** group (`Messages -> Team Inbox`), representing the shared team workspace for replying to WhatsApp customer threads.
- **Channel Storage:** Meta App ID, Phone Number ID, WhatsApp Business Account ID, and Access Tokens are stored encrypted at rest using AES-256-GCM.
- **Channel Health Monitoring:** Provides health status checks (Quality Rating, Messaging Limit, Throughput Rate, Webhook status).
- **Test Message:** Sends a direct sandbox/live HSM or standard text message to the specified verification number.
- **Display Name Request:** Creates an auditable change request record stored with status `Pending Meta Review`.

---

## 7. Team Inbox & 24-Hour Session Rule
- **24-Hour Window:** Meta Cloud API policy restricts free-form messaging to 24 hours from the customer's last inbound message (`lastInboundAt`).
- **Session Closed Behavior:** If `now - lastInboundAt > 24 hours`, free-form message input is disabled with `Templates only (24-hr session closed)`. Only approved Whatway templates can be sent to reopen the window.
- **Real-Time Updates:** Socket.IO emits events (`message:received`, `message:status_updated`, `conversation:status_changed`) to all agents in the client room.

---

## 8. AI Voice Agents, Guided Wizard & Voice Library
- **Agent Types:**
  - `Incoming Agent`: Open-ended conversational voice AI linked to an inbound phone number via Incoming Connections.
  - `Flow Agent`: Deterministic step-by-step conversational flow used for outbound bulk campaigns.
- **Guided Wizard:** 6 steps (1: Use Case, 2: Basic Info, 3: Personality, 4: Prompts & Templates, 5: Voice Fine-Tuning, 6: Review & Launch).
- **Voice Library:** Catalog of 21 pre-configured high-fidelity voices (ElevenLabs, Azure Neural, OpenAI) with sample audio previews and metadata (gender, accent, age).
- **Version History:** Every edit creates an immutable snapshot in `AgentVersion`, allowing rollbacks.

---

## 9. Phone Numbers & Incoming Connections
- **Phone Number Lifecycle:** Phone numbers are managed and assigned to clients by the Super Admin. Clients can view allocated numbers, review usage/costs, and release or link them to Incoming Agents.
- **Incoming Connections:** Connects a dedicated phone number to an active Incoming Agent with telephony stack settings (e.g. Twilio + ElevenLabs, Plivo + OpenAI).

---

## 10. Calls, Conversations & Quick CRM
- **Call Records:** Stores call direction (`incoming` / `outgoing`), caller/callee numbers, provider, duration, recording URL, transcription, and AI sentiment analysis.
- **Quick CRM Leads:** Automatically categorized from call transcript analysis into categories (`Warm Lead`, `Hot Lead`, `Appointment Booked`, `Form Submitted`, `Call Transfer`, `Need Follow Up`).
- **Kanban Board:** Displays leads grouped by category with drag-and-drop status update support.

---

## 11. Visual Flow Builder & Assignment (Super Admin)
- **Node Types:** `Message`, `Question`, `Condition`, `Appointment`, `Form`, `Webhook`, `Transfer`, `Delay`, `Play Audio`, `End`.
- **Canvas Graph Schema:** Visual flow stored as a DAG of nodes with positions `{ x, y }`, data configurations, and directed edges `{ id, source, target, sourceHandle, targetHandle }`.
- **Flow Assignment:** Super Admin assigns flows to specific client workspaces, phone numbers, and voice agents with an effective date.

---

## 12. Public REST API & Rate Limiting
- **Authentication Headers:** `X-API-Key`, `X-API-Secret`, and `X-Channel-Id` (or `channel_id` query param).
- **Rate Limits:** 120 requests/minute per key, burst limit 30 requests/second, 60s cooldown window. Returns HTTP 429 when exceeded.
