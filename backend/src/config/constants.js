export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  SYSTEM_ADMIN: 'System Admin',
  ADMIN_OPERATOR: 'Admin Operator',
  INBOX_AGENT: 'Inbox Agent',
};

export const CLIENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
};

export const USER_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  INACTIVE: 'inactive',
};

export const CAMPAIGN_STATUS = {
  DRAFT: 'Draft',
  SCHEDULED: 'Scheduled',
  ONGOING: 'Ongoing',
  COMPLETED: 'Completed',
  PAUSED: 'Paused',
  FAILED: 'Failed',
};

export const CHANNEL_TYPES = {
  WHATSAPP: 'whatsapp',
  VOICE: 'voice',
};

export const META_TEMPLATE_STATUS = {
  APPROVED: 'Approved',
  IN_REVIEW: 'In Review',
  REJECTED: 'Rejected',
  DRAFT: 'Draft',
};

export const VOICE_TEMPLATE_STATUS = {
  ACTIVE: 'Active',
  IN_REVIEW: 'In Review',
  DRAFT: 'Draft',
};

export const AGENT_TYPES = {
  INCOMING: 'Incoming',
  FLOW: 'Flow',
};

export const CRM_CATEGORIES = {
  ALL_LEADS: 'All Leads',
  WARM_LEAD: 'Warm Lead',
  HOT_LEAD: 'Hot Lead',
  APPOINTMENT_BOOKED: 'Appointment Booked',
  FORM_SUBMITTED: 'Form Submitted',
  CALL_TRANSFER: 'Call Transfer',
  NEED_FOLLOW_UP: 'Need Follow Up',
};

export const VALIDATION_LIMITS = {
  WHATSAPP_TEMPLATE_HEADER_MAX: 60,
  WHATSAPP_TEMPLATE_BODY_MAX: 1024,
  WHATSAPP_TEMPLATE_FOOTER_MAX: 60,
  WHATSAPP_BUTTONS_MAX: 3,
  VOICE_FIRST_MESSAGE_MAX: 300,
  AI_SYSTEM_PROMPT_MAX: 4000,
  KB_TEXT_CONTENT_MAX: 300000,
  KB_STORAGE_LIMIT_BYTES: 20 * 1024 * 1024, // 20 MB
  CAMPAIGN_AUTO_PURGE_DAYS: 30,
  RATE_LIMIT_PER_MINUTE: 120,
  RATE_LIMIT_BURST_PER_SECOND: 30,
};
