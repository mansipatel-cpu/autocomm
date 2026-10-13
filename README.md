# AutoComm &mdash; Unified Multi-Tenant Omnichannel SaaS Platform

AutoComm is a production-grade, multi-tenant enterprise communication and automation platform providing dual-channel orchestration:
1. **WhatsApp Business Cloud API ("Whatway")**: Official Meta Graph API messaging, HSM pre-approved templates, 24-hour customer care session window enforcement, and live multi-agent Team Inbox.
2. **AI Voice Calling ("AgentLab" / Auto Calling)**: Inbound and outbound conversational AI voice agents, visual decision tree flow routing, neural voice library with 21 curated voices, call recordings, speech-to-text transcripts, and AI sentiment analysis.

---

## 🏛 Architecture & Tech Stack

```
                                  ┌───────────────────────────┐
                                  │      Client Web App       │ (Vite + React, Port 5173)
                                  │   (Tenant Administrator)  │ Dark Slate #0d1527 + Radiant Teal
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
┌───────────────────────────┐     ┌───────────────────────────┐     ┌───────────────────────────┐
│     Super Admin App       │────▶│   Unified Express API     │◀────│      Meta Cloud API       │
│  (Platform Root Console)  │     │   (Node.js, Port 5000)    │     │   (Inbound / Status Hook) │
│ (Vite + React, Port 5174) │     └─────────────┬─────────────┘     └───────────────────────────┘
└───────────────────────────┘                   │
                                                ▼
                                  ┌───────────────────────────┐
                                  │   BullMQ Queue + Redis    │
                                  │  (Async Dispatches & Jobs)│
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
                                  ┌───────────────────────────┐
                                  │   PostgreSQL (pg Pool)    │
                                  │   (Strict Tenant Schema)  │
                                  └───────────────────────────┘
```

- **Backend**: Node.js (ESM), Express.js, PostgreSQL (`pg` connection pool with relational schema), BullMQ / Redis, Socket.IO (realtime updates), Nodemailer, Winston logger, Zod validations, AES-256-GCM token encryption.
- **Client Frontend (`client-app`)**: Vite, React 19, Tailwind CSS, Lucide icons, dark slate sidebar `#0d1527` with radiant teal branding.
- **Super Admin Frontend (`superadmin-app`)**: Vite, React 19, Tailwind CSS, Lucide icons, deep slate sidebar `#0a0f1d` with indigo accenting.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18+ (or v20+)
- **PostgreSQL**: Local or PostgreSQL Cloud URI (Default: `postgresql://autocomm:autocomm_password@127.0.0.1:5432/autocomm`)
- **Redis**: Local or Redis Cloud (Default: `redis://localhost:6379`)

### 2. Environment Variables
Copy `.env.example` to `.env` at the root and inside `backend/`:
```bash
cp .env.example .env
cp .env.example backend/.env
```

### 3. Docker Compose (Optional One-Command Spinup)
To run PostgreSQL and Redis via Docker:
```bash
docker-compose up -d
```

### 4. Install Dependencies
AutoComm uses NPM Workspaces across root, backend, client-app, and superadmin-app:
```bash
npm install
```

### 5. Initialize Database Schema
To provision all relational tables and indexes:
```bash
npm run db:init
```

### 6. Seed Database with Full Demo Suite
Populate Super Admin root, demo client company ("Capermint Technologies"), contacts, WhatsApp channels, voice agents, call transcripts, CRM leads, and visual decision flows:
```bash
npm run seed --workspace=autocomm-backend
```

### 7. Run Development Servers
You can run all three servers concurrently or individually:

```bash
# Terminal 1: Backend API & Background Workers
npm run dev --workspace=autocomm-backend

# Terminal 2: Client Web App (Port 5173)
npm run dev --workspace=autocomm-client-app

# Terminal 3: Super Admin App (Port 5174)
npm run dev --workspace=autocomm-superadmin-app
```

---

## 🔐 Default Seed Credentials

### Super Admin Portal (`http://localhost:5174`)
- **Email**: `superadmin@autocomm.io`
- **Password**: `SuperAdmin@2026`
- **Scope**: Multi-tenant client provisioning, user administration, system email templates, visual flow builder, cross-tenant telemetry & reports.

### Client Company Console (`http://localhost:5173`)
- **Email**: `alex.vance@autocomm.io`
- **Password**: `ClientAdmin@2026`
- **Tenant**: Capermint Technologies (`CLI-1001`)
- **Scope**: Campaigns, Contacts & Groups, Team Inbox, AI Agents (AgentLab), Knowledge Base, Voice Library, Phone Numbers, Calls & Conversations, Quick CRM, Channel & AI Settings, REST API Docs.

---

## 🧪 Testing & Verification

The backend includes a comprehensive Jest test suite covering all 7 phases:
```bash
npm test --workspace=autocomm-backend
```
*Current test suite status: 7 passed suites, 37 passing unit & integration tests.*

Both React frontends have been verified with complete production bundles:
```bash
npm run build --workspace=autocomm-client-app
npm run build --workspace=autocomm-superadmin-app
```

---

## 📚 Key Technical Implementations & Business Rules

1. **24-Hour WhatsApp Session Window**:
   - Meta Cloud API restricts outbound freeform messages after 24 hours of customer inactivity.
   - The Team Inbox monitors `conversation.lastInboundAt`. If expired, freeform typing is disabled, and an alert banner guides the agent to send pre-approved HSM Meta templates.
2. **Multi-Tenant Isolation**:
   - Every database query in the tenant portal is scoped strictly by `clientId` extracted from the cryptographically verified JWT token (`req.user.clientId`).
3. **AES-256-GCM Credential Encryption**:
   - Meta Permanent Access Tokens and AI Provider keys are encrypted at rest using AES-256-GCM with authentication tags.
4. **AgentLab 6-Step Guided Wizard**:
   - Guided builder enabling rapid creation of conversational AI voice agents with voice selection, persona instructions, knowledge grounding, and phone DID linkage.
5. **Quick CRM Pipeline**:
   - 6-stage Kanban board (`NEW_LEAD`, `CONTACTED`, `QUALIFIED`, `PROPOSAL_SENT`, `WON`, `LOST`) tracking deal values and sentiments captured from automated calls and WhatsApp chats.

---

## 📄 License & Ownership
Copyright © 2026 AutoComm Technologies Inc. All rights reserved.
