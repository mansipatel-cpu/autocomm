# AutoComm Registration Portal

A standalone, fault-tolerant **User Registration Portal** integrating with the **AutoComm REST API** to automatically onboard users, create contacts, and trigger WhatsApp messages and automated AI voice calls.

---

## 🌟 Key Features

1. **Public Registration Form (Page 1)**:
   - Full Name\*, Email\*, Phone\* (with international country code dropdown + E.164 formatting & validation), and optional Company.
   - Mandatory Consent Checkbox\*: *"I agree to receive WhatsApp messages and automated calls from AutoComm on this number."*
   - Real-time inline field validation and duplicate rejection by phone number.
   - Thank-you confirmation screen upon success: *"You're registered. You will receive a WhatsApp message and a call shortly."*

2. **Admin Status Dashboard (Page 2)**:
   - Protected via `ADMIN_PASSWORD`.
   - Real-time registrations table: Name, Phone, Registered At, Contact Status, Message Status, Call Status, and Error details.
   - Live search filter across names, phones, emails, companies, and statuses.
   - One-click **Retry** button per row to re-trigger failed pipeline steps without data loss.
   - Interactive **Webhook Simulator** to test incoming WhatsApp delivery (`delivered`, `read`) and call updates (`completed`, `failed`).

3. **Backend Pipeline Flow (`POST /api/register`)**:
   - **Step 1**: Validate input & require consent. Reject duplicates by phone number.
   - **Step 2**: Save the user locally in SQLite with status `registered` and consent timestamp.
   - **Step 3**: Call AutoComm API sending headers:
     - `X-API-Key: AUTOCOMM_API_KEY`
     - `X-API-Secret: AUTOCOMM_API_SECRET`
     - `X-Channel-Id: AUTOCOMM_CHANNEL_ID`
     - **3a**: Create contact (`POST {AUTOCOMM_BASE_URL}/<CONTACTS_ENDPOINT>`).
     - **3b**: Add contact to group `AUTOCOMM_GROUP_ID`.
     - **3c**: Trigger WhatsApp template message (`AUTOCOMM_TEMPLATE_NAME`) or WhatsApp campaign (`AUTOCOMM_WA_CAMPAIGN_ID`).
     - **3d**: Trigger Auto Calling campaign (`AUTOCOMM_CALL_CAMPAIGN_ID`) with contact details.
   - **Step 4**: Store response IDs (`autocomm_contact_id`, `autocomm_message_id`, `autocomm_call_id`) and status in SQLite.
   - **Step 5**: Consistent response format: `{ success: boolean, data?: any, error?: string }`.
   - **Step 6**: Fault-tolerant per-step error boundaries allowing retry.

4. **Rules & Compliance**:
   - **Rule 1**: All AutoComm endpoint paths centralized in `backend/src/config/autocomm.endpoints.js`.
   - **Rule 2**: Built-in token bucket rate limiter capped at **120 requests/minute** per API key, with automatic queueing and exponential backoff retry on HTTP 429.
   - **Rule 3**: Secrets (`X-API-Key`, `X-API-Secret`, `ADMIN_PASSWORD`, `WEBHOOK_SECRET`) are never logged. Phone numbers are automatically masked in server logs (`+91 98*** **210`).
   - **Rule 4**: Realistic Mock Mode (`MOCK_AUTOCOMM=true`) enabled by default so the portal can be tested before real API keys are added.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Lucide Icons, Vanilla Modern CSS System with Glassmorphism and Responsive Layout.
- **Backend**: Node.js (v18+ / v20+), Express, SQLite (`better-sqlite3` with WAL mode).
- **Security**: AutoComm credentials reside **strictly in the backend `.env`** and are never exposed to the browser.

---

## 📁 Project Structure

```text
registration-portal/
├── README.md                           # Documentation & usage guide
├── package.json                        # Root convenience scripts
├── backend/
│   ├── .env.example                    # Template with placeholders
│   ├── .env                            # Backend configuration (secrets stay here)
│   ├── package.json
│   ├── data/
│   │   └── portal.db                   # SQLite database (auto-created)
│   └── src/
│       ├── config/
│       │   ├── env.js                  # Environment parser
│       │   └── autocomm.endpoints.js   # Centralized AutoComm API paths (Rule 1)
│       ├── db/
│       │   ├── database.js             # SQLite initialization & schema
│       │   └── registration.repository.js # CRUD & reporting queries
│       ├── middleware/
│       │   ├── auth.middleware.js      # Protects Admin routes via ADMIN_PASSWORD
│       │   └── error.middleware.js     # Unified error formatting
│       ├── routes/
│       │   ├── admin.routes.js         # /api/admin (login, list, retry, stats)
│       │   ├── registration.routes.js  # /api/register
│       │   └── webhook.routes.js       # /api/webhooks/autocomm
│       ├── services/
│       │   ├── autocomm.client.js      # Live REST client with rate limiter & 429 retry
│       │   ├── autocomm.mock.js        # Mock mode responses (Rule 4)
│       │   ├── autocomm.service.js     # Unified dispatcher (Mock vs Live)
│       │   ├── rate-limiter.service.js # 120 req/min token bucket & 429 backoff (Rule 2)
│       │   └── registration.service.js # Orchestration & retry pipeline (Steps 1-6)
│       ├── utils/
│       │   ├── logger.js               # Redacts secrets & masks phones (Rule 3)
│       │   └── phone.js                # E.164 normalization & validation
│       └── server.js                   # Express server entry point (port 3000)
└── frontend/
    ├── package.json
    ├── vite.config.js                  # Vite config (port 5173, backend proxy)
    ├── index.html
    └── src/
        ├── App.jsx                     # Page router & admin auth state
        ├── index.css                   # Sleek styling & theme tokens
        ├── main.jsx
        ├── components/
        │   ├── AdminDashboard.jsx      # Admin table, search, stats, retry
        │   ├── AdminLoginModal.jsx     # Password gate modal
        │   ├── CountryCodeSelect.jsx   # International dial code picker
        │   ├── Navbar.jsx              # Header with Mode badge & tabs
        │   ├── RegistrationForm.jsx    # Public registration form
        │   ├── StatusBadge.jsx         # Status badges
        │   └── SuccessCard.jsx         # Thank-you screen
        └── services/
            └── api.js                  # Frontend API requests
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js version 18.0.0 or higher.
- npm version 9.0.0 or higher.

### 2. Installation

Install dependencies for both backend and frontend:

```bash
# In the registration-portal directory:
cd backend
npm install

cd ../frontend
npm install
```

### 3. Running the Application

You can run both backend and frontend in parallel:

#### Terminal 1 — Start Backend (Port 3000):
```bash
cd backend
npm run dev
```
*Backend runs at `http://localhost:3000` (and also serves the production frontend).*

#### Terminal 2 — Start Frontend (Port 5173):
```bash
cd frontend
npm run dev
```
*Frontend dev server runs at `http://localhost:5173` with instant hot-reloading.*

---

## ⚙️ Environment Variables & Connecting Real Keys

All configuration is stored in `backend/.env`.

### Testing in Mock Mode (Default)
When `MOCK_AUTOCOMM=true`, the backend simulates all AutoComm responses with realistic latency (150–300ms) without contacting the external network. You can test registration, duplicate rejection, and retries immediately out of the box.

```env
MOCK_AUTOCOMM=true
ADMIN_PASSWORD=admin123
WEBHOOK_SECRET=webhook_secret_key_123
```

### Connecting to Real AutoComm
To switch from Mock Mode to Live AutoComm:
1. Open `backend/.env`.
2. Change `MOCK_AUTOCOMM=false`.
3. Paste your real AutoComm credentials:

```env
# AutoComm API Credentials
AUTOCOMM_BASE_URL=https://YOUR_AUTOCOMM_URL/api
AUTOCOMM_API_KEY=YOUR_API_KEY
AUTOCOMM_API_SECRET=YOUR_API_SECRET
AUTOCOMM_CHANNEL_ID=YOUR_CHANNEL_ID

# Target Audience & Campaigns
AUTOCOMM_GROUP_ID=YOUR_AUDIENCE_GROUP_ID
AUTOCOMM_TEMPLATE_NAME=registration_welcome
AUTOCOMM_WA_CAMPAIGN_ID=YOUR_WHATSAPP_CAMPAIGN_ID
AUTOCOMM_CALL_CAMPAIGN_ID=YOUR_CALLING_CAMPAIGN_ID

# Admin & Webhook Protection
ADMIN_PASSWORD=your_secure_admin_password
WEBHOOK_SECRET=your_shared_webhook_secret

# Switch to Live Mode
MOCK_AUTOCOMM=false
PORT=3000
NODE_ENV=production
```

4. Restart the backend: `npm run dev`.

---

## 📡 AutoComm Endpoint Customization (Rule 1)

All AutoComm endpoint paths are defined in one place:
`backend/src/config/autocomm.endpoints.js`:

```javascript
export const autocommEndpoints = {
  // Step 3a: Contact creation endpoint
  contacts: process.env.AUTOCOMM_CONTACTS_ENDPOINT || '/contacts',

  // Step 3b: Add contact to group
  groupAdd: (groupId) => `/whatsapp/v1/contacts/groups/${encodeURIComponent(groupId)}/add`,

  // Step 3c: Trigger WhatsApp template message
  messagingTemplate: process.env.AUTOCOMM_MESSAGING_ENDPOINT || '/whatsapp/v1/messages/template',

  // Step 3c (Campaign mode): Add to WhatsApp campaign audience
  whatsappCampaignAdd: (campaignId) => `/campaigns/${encodeURIComponent(campaignId)}/contacts-csv`,

  // Step 3d: Trigger Auto Calling campaign
  callingCampaignAdd: (campaignId) => `/campaigns/${encodeURIComponent(campaignId)}/contacts-csv`,
};
```
If your AutoComm deployment uses custom routes, you can override them via `.env` without modifying any service code.

---

## ⚡ Rate Limiting & Backoff (Rule 2)

AutoComm imposes a rate limit of **120 requests/minute** per API key.
The built-in token bucket rate limiter in `backend/src/services/rate-limiter.service.js`:
- Regulates outgoing requests so they never exceed the threshold.
- Queues excessive requests in memory.
- If AutoComm responds with an `HTTP 429 Too Many Requests`, the limiter pauses the queue, parses `Retry-After`, and retries with exponential backoff (1s, 2s, 4s).

---

## 🛡️ Privacy & Phone Masking (Rule 3)

In accordance with privacy standards:
- API keys, secrets, passwords, and authorization tokens are strictly omitted from log streams.
- Any phone number printed in terminal logs is automatically sanitized into masked format:
  `+1 (415) 555-1212` ➔ `+141*** **212`

---

## 💻 cURL Examples

### 1. Register a User (`POST /api/register`)

```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Sarah Connor",
    "email": "sarah.connor@example.com",
    "phone": "+14155558989",
    "company": "Cyberdyne Systems",
    "consent": true
  }'
```

#### Successful Response (`HTTP 201`):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "fullName": "Sarah Connor",
    "phone": "+14155558989",
    "status": "completed",
    "contactStatus": "contact_created",
    "messageStatus": "message_queued",
    "callStatus": "call_queued",
    "createdAt": "2026-10-23T06:20:34.900Z",
    "message": "You're registered. You will receive a WhatsApp message and a call shortly."
  }
}
```

#### Duplicate Phone Rejection (`HTTP 400`):
```json
{
  "success": false,
  "error": "A registration with phone number '+14155558989' already exists."
}
```

---

### 2. Admin Login (`POST /api/admin/login`)

```bash
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "password": "admin123"
  }'
```

#### Response (`HTTP 200`):
```json
{
  "success": true,
  "data": {
    "token": "admin123",
    "message": "Admin authentication successful",
    "isMockMode": true
  }
}
```

---

### 3. List Registrations (`GET /api/admin/registrations`)

```bash
curl -X GET "http://localhost:3000/api/admin/registrations?search=Sarah" \
  -H "Authorization: Bearer admin123"
```

#### Response (`HTTP 200`):
```json
{
  "success": true,
  "data": {
    "rows": [
      {
        "id": 1,
        "full_name": "Sarah Connor",
        "email": "sarah.connor@example.com",
        "phone": "+14155558989",
        "company": "Cyberdyne Systems",
        "status": "completed",
        "contact_status": "contact_created",
        "message_status": "message_queued",
        "call_status": "call_queued",
        "autocomm_contact_id": "cnt_f078b30dfa079b5e",
        "autocomm_message_id": "wamid_1a2375233de8c15429167081",
        "autocomm_call_id": "call_88dddc233afad2fa",
        "last_error": null,
        "retry_count": 0,
        "created_at": "2026-10-23T06:20:34.900Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 50
  }
}
```

---

### 4. Retry Failed Registration Step (`POST /api/admin/registrations/:id/retry`)

```bash
curl -X POST http://localhost:3000/api/admin/registrations/1/retry \
  -H "Authorization: Bearer admin123"
```

#### Response (`HTTP 200`):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "completed",
    "contact_status": "contact_created",
    "message_status": "message_queued",
    "call_status": "call_queued",
    "retry_count": 1
  }
}
```

---

### 5. Webhook Update from AutoComm (`POST /api/webhooks/autocomm`)

Simulates an AutoComm delivery receipt (WhatsApp status: `delivered`):

```bash
curl -X POST http://localhost:3000/api/webhooks/autocomm \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: webhook_secret_key_123" \
  -d '{
    "type": "message",
    "phone": "+14155558989",
    "status": "delivered",
    "timestamp": "2026-10-23T06:22:00.000Z"
  }'
```

#### Response (`HTTP 200`):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "phone": "+14155558989",
    "message_status": "delivered"
  }
}
```

---

## 🧪 Verification & Testing Completed

- [x] **Registration UI & Validation**: Tested name, email, E.164 phone formats, and consent checkbox enforcement.
- [x] **Duplicate Rejection**: Verified `HTTP 400` conflict response when re-submitting the same phone number.
- [x] **Thank-You Confirmation**: Verified confirmation message *"You're registered. You will receive a WhatsApp message and a call shortly."*
- [x] **Admin Password Gate**: Password verification via `ADMIN_PASSWORD` header and Bearer token.
- [x] **Status Table & Live Search**: Filtered registrations by name, phone, and status.
- [x] **Fault Tolerance & Retry**: Individual retry capability per row.
- [x] **Webhook Integration**: Real-time status update from AutoComm webhook events (`sent` ➔ `delivered` ➔ `read`).
- [x] **Rate Limiter & Phone Masking**: Tested 120 req/min token bucket limiter, secret sanitization, and phone number masking in logs.
