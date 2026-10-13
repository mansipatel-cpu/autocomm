# Super Admin Implementation Assumptions

Based on Section 21 ("Super Admin Features") of `autocomm/docs/AutoComm_Overview_Document_.pdf`:

1. **Cross-Tenant Repository & Service Reuse**
   - Super Admin controllers and services reuse existing models (`Client`, `User`, `Campaign`, `Contact`, `Group`, `Template`, `Channel`, `Agent`, `KnowledgeSource`, `PhoneNumber`, `CallRecord`, `CrmLead`, `ConversationFlow`, `IncomingConnection`) from `src/modules/*`.
   - Unlike tenant APIs that enforce `requireTenant` scoping (`WHERE client_id = req.clientId`), Super Admin queries run unscoped or filtered by an optional `clientId` parameter to view cross-tenant and tenant-specific data.

2. **Audit Logging Specification**
   - Every write operation (Create, Update, Delete, Status Toggle, Password Reset, Resend Credentials, Assign, Release) performed by a Super Admin will produce an immutable record in the `audit_logs` database table.
   - Audit records track `adminId`, `adminEmail`, `action`, `resourceType`, `resourceId`, `details`, `ipAddress`, and `createdAt`.
   - An endpoint `GET /api/v1/superadmin/audit-logs` and a quick-action view in the UI will allow viewing and filtering audit history.

3. **Atomic Client Creation & Queued Credential Delivery**
   - `ClientService.createClient` will run atomically: creating the client record and initial admin user. If any database step fails, any partial entity is cleaned up (rolled back).
   - Sending credentials via email will be dispatched to the existing background queue (`emailQueue` or BullMQ worker) with exponential backoff retry so email delivery failures do not block or corrupt tenant workspace provisioning.

4. **Credential & Token Masking**
   - Password hashes are excluded from all query outputs via `.select('-passwordHash')` or serialization filtering.
   - WhatsApp channel permanent access tokens are never returned raw in Super Admin lists or logs; they are masked (e.g., `EAA...***[last 4]`).

5. **Consolidation of Overlapping Spec Sections**
   - **Contacts**: Section 21.8 ("Contact / User Monitoring") and Section 21.11 ("Contact Management") both cover client contacts. We provide a single rich module covering monitoring (cross-tenant filter, search, export) and administrative control (add, edit, delete, import, bulk actions, group assignment).
   - **Channels**: Section 21.9 ("Channel & Integration Management") and Section 21.14 ("Channel Management") both cover WhatsApp channels. We provide a single rich module covering health telemetry, status, business profile inspection, configuration, enable/disable, and disconnect.

6. **Phone Number Exclusivity Rule**
   - Section 21.20 explicitly mandates: "One number belongs to only one client at a time."
   - Assignment and reassignment operations enforce unique ownership across active allocations.

7. **Reports & Analytics Aggregations**
   - Section 21.22 lists 10 reports (Client, Campaign, WhatsApp Message, Calling, Contact, User Activity, AI Agent, Flow, Phone Number, Channel).
   - Reports provide tabular breakdowns, summary metrics, and CSV/JSON export capability for each specified domain.

8. **Credits Management**
   - Section 21.2 includes "Manage Credits" as a quick action. This will open a credit adjustment drawer/modal allowing Super Admins to allocate or adjust SMS/WhatsApp message and Voice calling credits for any client workspace.
