const API_BASE = '/api';

export const api = {
  // Public Registration
  async register(data) {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Admin Authentication
  async adminLogin(password) {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    return res.json();
  },

  // Get Admin Registrations
  async getRegistrations(token, search = '', page = 1, limit = 50) {
    const params = new URLSearchParams({
      search,
      page: String(page),
      limit: String(limit),
    });

    const res = await fetch(`${API_BASE}/admin/registrations?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.json();
  },

  // Get Admin Stats
  async getStats(token) {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.json();
  },

  // Retry Failed Registration Step
  async retryRegistration(token, id) {
    const res = await fetch(`${API_BASE}/admin/registrations/${id}/retry`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.json();
  },

  // Trigger Webhook Event (for testing)
  async triggerWebhook(secret, payload) {
    const res = await fetch(`${API_BASE}/webhooks/autocomm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': secret,
      },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Check Backend Health & Mode
  async checkHealth() {
    try {
      const res = await fetch('/health');
      return res.json();
    } catch {
      return { success: false, isMockAutoComm: false };
    }
  },
};
