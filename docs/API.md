# AutoComm - REST API Specification

## 1. Global Standards

### Base URL
- Client & Public API: `http://localhost:5000/api/v1`
- Super Admin API: `http://localhost:5000/api/v1/superadmin`

### Response Format
All API endpoints follow the standard response envelope:
```json
{
  "success": true,
  "data": {},
  "message": "Optional human-readable confirmation"
}
```
Error response envelope:
```json
{
  "success": false,
  "error": "Error description or validation message",
  "details": []
}
```

### Authentication Schemes
1. **Bearer JWT (Client App):**
   - Header: `Authorization: Bearer <access_token>`
   - Scoped to `clientId` and user role.
2. **Bearer JWT (Super Admin App):**
   - Header: `Authorization: Bearer <superadmin_access_token>`
   - Audience: `autocomm:superadmin`.
3. **Public API Key Auth:**
   - Headers:
     - `X-API-Key: <api_key>`
     - `X-API-Secret: <api_secret>`
     - `X-Channel-Id: <channel_id>` (optional if key is tied to a single channel, otherwise required)
   - Rate Limit: 120 requests/minute, burst allowance 30 requests/second. 429 Too Many Requests upon limit breach.

---

## 2. Authentication Endpoints

### `POST /auth/login`
- Body: `{ email, password, rememberMe }`
- Response: `{ token, refreshToken, user: { id, name, email, role, clientId, mustChangePassword } }`

### `POST /auth/refresh`
- Body: `{ refreshToken }`
- Response: `{ token, refreshToken }`

### `POST /auth/change-password`
- Body: `{ currentPassword, newPassword }`
- Response: `{ success: true, message: "Password updated successfully" }`

---

## 3. Super Admin Endpoints (`/superadmin/*`)

### `POST /superadmin/auth/login`
- Body: `{ username, password }`
- Response: `{ token, user: { id, username, role: "Super Admin" } }`

### `GET /superadmin/dashboard`
- Response: Total and active clients, users, campaigns, messages, calls, contacts, templates, active flows, phone numbers.

### `POST /superadmin/clients`
- Creates client workspace, generates admin credentials, sends invitation email via Nodemailer template.
- Body: `{ companyName, adminEmail, contactNumber, plan, initialCredits }`

### `GET /superadmin/clients`
- Query params: `search`, `status`, `plan`, `page`, `limit`.

### `PATCH /superadmin/clients/:id/status`
- Body: `{ status: "active" | "inactive" | "suspended" }`

### `POST /superadmin/clients/:id/reset-password`
- Regenerates password and emails credentials.

### `GET|POST|PUT|DELETE /superadmin/email-templates`
- Manage system email templates (Welcome Email, Client Credential Email, etc.).

### `GET|POST|PUT|DELETE /superadmin/flows`
- Visual Flow Builder CRUD with nodes, conditions, questions, webhooks.

### `POST /superadmin/flows/assign`
- Assigns flow to client, voice agent, and phone number.

---

## 4. Client Core Endpoints

### Campaigns
- `GET /campaigns?type=whatsapp|voice&status=&page=&limit=`
- `POST /campaigns/whatsapp`
- `POST /campaigns/voice`
- `GET /campaigns/:id`
- `DELETE /campaigns/:id` (soft delete)
- `GET /campaigns/deleted`
- `POST /campaigns/:id/restore`
- `GET /campaigns/:id/export?format=csv|xlsx|pdf`

### Templates
- `GET /templates?type=whatsapp|voice&status=`
- `POST /templates/whatsapp` (validates Meta character limits & variables)
- `POST /templates/voice`
- `POST /templates/sync-meta`

### Contacts & Groups
- `GET /contacts?search=&status=&channel=&page=&limit=`
- `POST /contacts`
- `POST /contacts/import-csv`
- `GET /contacts/export-csv`
- `POST /contacts/bulk-action` (`add_to_group`, `export`, `delete`)
- `GET|POST|PUT|DELETE /groups`

### Team Inbox
- `GET /team-inbox/conversations?filter=all|unread|wa|widget|assigned`
- `GET /team-inbox/conversations/:id/messages`
- `POST /team-inbox/conversations/:id/messages` (enforces 24-hr session rule)
- `POST /team-inbox/conversations/:id/send-template`
- `PATCH /team-inbox/conversations/:id/status` (`OPEN` | `Resolved`)

### Channels
- `GET|POST /channels`
- `POST /channels/:id/test-message`
- `GET|PUT /channels/:id/profile`
- `POST /channels/:id/display-name-request`
- `POST /channels/:id/disconnect`

### AI Agents & Guided Wizard
- `GET|POST /ai-agents`
- `GET|PUT|DELETE /ai-agents/:id`
- `GET /ai-agents/:id/versions`
- `POST /ai-agents/:id/rollback/:versionId`

### Knowledge Base & Voice Library
- `GET /knowledge-base`
- `POST /knowledge-base/url`
- `POST /knowledge-base/upload`
- `POST /knowledge-base/text`
- `GET /voice-library`

### Calls & Conversations
- `GET /calls?direction=&status=&sentiment=&lead=&page=&limit=`
- `GET /calls/:id`
- `GET /calls/:id/recording`

### Quick CRM
- `GET /crm/leads?category=&source=&search=`
- `PATCH /crm/leads/:id/category` (drag and drop)
- `POST /crm/leads/:id/notes`
- `GET|PUT /crm/settings`
