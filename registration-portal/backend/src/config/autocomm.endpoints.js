/**
 * Centralized AutoComm Endpoint Configuration
 * Rule 1: Put all AutoComm endpoint paths in one config file so they are easy to change.
 */

export const autocommEndpoints = {
  // Step 3a: Create contact endpoint
  // Standard AutoComm contact creation route: POST /contacts (or /whatsapp/v1/contacts)
  contacts: process.env.AUTOCOMM_CONTACTS_ENDPOINT || '/contacts',

  // Step 3b: Add contact to group endpoint
  // Standard AutoComm group add route: POST /whatsapp/v1/contacts/groups/:groupId/add or /contacts/bulk-action
  groupAdd: (groupId) => {
    if (process.env.AUTOCOMM_GROUP_ADD_ENDPOINT) {
      return process.env.AUTOCOMM_GROUP_ADD_ENDPOINT.replace(':groupId', encodeURIComponent(groupId));
    }
    return `/whatsapp/v1/contacts/groups/${encodeURIComponent(groupId)}/add`;
  },

  // Step 3c: Trigger WhatsApp template message endpoint
  // AutoComm template message trigger: POST /whatsapp/v1/messages/template
  // Alternatively fallback to /campaigns/:campaignId/contacts-csv if using campaign
  messagingTemplate: process.env.AUTOCOMM_MESSAGING_ENDPOINT || '/whatsapp/v1/messages/template',

  // Step 3c (Alternative): Add to WhatsApp campaign audience
  whatsappCampaignAdd: (campaignId) => {
    if (process.env.AUTOCOMM_WA_CAMPAIGN_ADD_ENDPOINT) {
      return process.env.AUTOCOMM_WA_CAMPAIGN_ADD_ENDPOINT.replace(':campaignId', encodeURIComponent(campaignId));
    }
    return `/campaigns/${encodeURIComponent(campaignId)}/contacts-csv`;
  },

  // Step 3d: Trigger Auto Calling campaign endpoint
  // Add contact to existing Auto Calling campaign: POST /campaigns/:campaignId/contacts-csv
  callingCampaignAdd: (campaignId) => {
    if (process.env.AUTOCOMM_CALL_CAMPAIGN_ADD_ENDPOINT) {
      return process.env.AUTOCOMM_CALL_CAMPAIGN_ADD_ENDPOINT.replace(':campaignId', encodeURIComponent(campaignId));
    }
    return `/campaigns/${encodeURIComponent(campaignId)}/contacts-csv`;
  },

  // Health / Account ping endpoint (used to verify live credentials)
  account: process.env.AUTOCOMM_ACCOUNT_ENDPOINT || '/whatsapp/v1/account',
};
