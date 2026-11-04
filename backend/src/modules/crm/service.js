import { query } from '../../config/database.js';
import { AppError } from '../../common/errors/app-error.js';

export const AI_CATEGORIES = [
  'appointment_booked',
  'form_submitted',
  'call_transfer',
  'need_follow_up',
  'hot',
  'warm',
];

export class CrmService {
  /**
   * Helper to format a Postgres crm_leads row into the frontend lead shape
   */
  static formatLead(row) {
    if (!row) return null;

    let cf = {};
    if (row.custom_fields) {
      if (typeof row.custom_fields === 'string') {
        try {
          cf = JSON.parse(row.custom_fields);
        } catch {
          cf = {};
        }
      } else {
        cf = row.custom_fields;
      }
    }

    const nameStr = (row.name || 'Lead').trim();
    const parts = nameStr.split(' ');
    const firstName = parts[0] || 'Lead';
    const lastName = parts.slice(1).join(' ') || '';

    const rawCategory = cf.aiCategory || row.stage || 'warm';
    const normalizedCategory = AI_CATEGORIES.includes(rawCategory.toLowerCase())
      ? rawCategory.toLowerCase()
      : 'warm';

    const phone = row.phone_number || '';
    const leadScore = typeof cf.leadScore === 'number' ? cf.leadScore : 85;

    return {
      id: row.id,
      _id: row.id,
      clientId: row.client_id,
      name: nameStr,
      firstName,
      lastName,
      phone,
      phoneNumber: phone,
      email: row.email || '',
      company: row.company || '',
      stage: normalizedCategory,
      stageId: normalizedCategory,
      aiCategory: normalizedCategory,
      leadScore,
      dealValue: parseFloat(row.deal_value || '0.00'),
      notes: row.notes || '',
      notesCount: row.notes ? 1 : 0,
      tags: cf.tags || ['Outbound Call', 'Lead'],
      lastCallAt: cf.lastCallAt || row.updated_at || row.created_at,
      callCount: cf.callCount || 1,
      aiSummary: cf.summary || row.notes || '',
      transcript: cf.transcript || '',
      customFields: cf,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * List categorized leads for paginated list view
   */
  static async listCategorizedLeads(clientId, queryParams = {}) {
    const { sortBy = 'newest', limit = 50, offset = 0, aiCategory, search } = queryParams;
    const lLimit = Math.max(1, parseInt(limit, 10) || 50);
    const lOffset = Math.max(0, parseInt(offset, 10) || 0);

    const whereConditions = ['client_id = $1'];
    const values = [clientId];
    let paramIdx = 2;

    if (aiCategory && aiCategory !== 'all') {
      whereConditions.push(
        `(LOWER(stage) = $${paramIdx} OR LOWER(COALESCE(custom_fields->>'aiCategory', '')) = $${paramIdx})`
      );
      values.push(aiCategory.toLowerCase());
      paramIdx++;
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      whereConditions.push(`(name ILIKE $${paramIdx} OR phone_number ILIKE $${paramIdx} OR email ILIKE $${paramIdx})`);
      values.push(term);
      paramIdx++;
    }

    const whereSql = whereConditions.join(' AND ');
    const orderSql = sortBy === 'oldest' ? 'created_at ASC' : 'created_at DESC';

    const [rowsRes, countRes] = await Promise.all([
      query(
        `SELECT * FROM crm_leads
         WHERE ${whereSql}
         ORDER BY ${orderSql}
         LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        [...values, lLimit, lOffset]
      ),
      query(
        `SELECT COUNT(*) AS total FROM crm_leads WHERE ${whereSql}`,
        values
      ),
    ]);

    const total = parseInt(countRes.rows[0]?.total || '0', 10);
    const leads = (rowsRes.rows || []).map(CrmService.formatLead);

    return {
      leads,
      hasMore: lOffset + leads.length < total,
      total,
    };
  }

  /**
   * Category counts matching { total, counts: { hot, warm, ... } }
   */
  static async getCategoryCounts(clientId) {
    const res = await query('SELECT * FROM crm_leads WHERE client_id = $1', [clientId]);
    const leads = (res.rows || []).map(CrmService.formatLead);

    const counts = {
      appointment_booked: 0,
      form_submitted: 0,
      call_transfer: 0,
      need_follow_up: 0,
      hot: 0,
      warm: 0,
    };

    for (const lead of leads) {
      const cat = lead.aiCategory;
      if (counts[cat] !== undefined) {
        counts[cat]++;
      } else {
        counts.warm++;
      }
    }

    return {
      total: leads.length,
      counts,
      ...counts, // fallback for root property access
    };
  }

  /**
   * AI Kanban grouped data matching { columns: { [catId]: { leads: [], total: n } } }
   */
  static async getAIKanban(clientId) {
    const res = await query(
      'SELECT * FROM crm_leads WHERE client_id = $1 ORDER BY updated_at DESC, created_at DESC',
      [clientId]
    );
    const leads = (res.rows || []).map(CrmService.formatLead);

    const columns = {
      appointment_booked: { leads: [], total: 0 },
      form_submitted: { leads: [], total: 0 },
      call_transfer: { leads: [], total: 0 },
      need_follow_up: { leads: [], total: 0 },
      hot: { leads: [], total: 0 },
      warm: { leads: [], total: 0 },
    };

    for (const lead of leads) {
      const cat = lead.aiCategory;
      if (columns[cat]) {
        columns[cat].leads.push(lead);
        columns[cat].total++;
      } else {
        columns.warm.leads.push(lead);
        columns.warm.total++;
      }
    }

    return {
      columns,
      ...columns, // fallback for direct root access
    };
  }

  /**
   * Pipeline overview
   */
  static async getPipeline(clientId) {
    const res = await query(
      'SELECT * FROM crm_leads WHERE client_id = $1 ORDER BY updated_at DESC',
      [clientId]
    );
    const leads = (res.rows || []).map(CrmService.formatLead);

    const pipeline = {};
    for (const cat of AI_CATEGORIES) {
      pipeline[cat] = [];
    }

    let totalValue = 0;
    for (const lead of leads) {
      if (pipeline[lead.stage]) {
        pipeline[lead.stage].push(lead);
      } else {
        pipeline.warm.push(lead);
      }
      totalValue += lead.dealValue || 0;
    }

    return {
      pipeline,
      stages: AI_CATEGORIES,
      totalLeads: leads.length,
      totalPipelineValue: totalValue,
    };
  }

  /**
   * Capture a call lead automatically into crm_leads
   */
  static async captureCallLead(clientId, { name, phoneNumber, isAnswered, summary, transcript }) {
    if (!phoneNumber) return null;

    const cat = isAnswered ? 'hot' : 'need_follow_up';
    const score = isAnswered ? 95 : 65;
    const dealVal = isAnswered ? 2500.00 : 800.00;

    // Check if lead with this phone number already exists
    const existing = await query(
      'SELECT * FROM crm_leads WHERE client_id = $1 AND phone_number = $2 LIMIT 1',
      [clientId, phoneNumber]
    );

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      const cf = typeof row.custom_fields === 'string' ? JSON.parse(row.custom_fields || '{}') : (row.custom_fields || {});
      cf.lastCallAt = new Date();
      cf.callCount = (cf.callCount || 1) + 1;
      if (isAnswered) {
        cf.aiCategory = 'hot';
        cf.leadScore = Math.max(cf.leadScore || 0, score);
      }
      if (summary) cf.summary = summary;
      if (transcript) cf.transcript = transcript;

      const upd = await query(
        `UPDATE crm_leads
         SET name = COALESCE($1, name),
             stage = $2,
             custom_fields = $3,
             updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [name || row.name, isAnswered ? 'hot' : row.stage, JSON.stringify(cf), row.id]
      );
      return CrmService.formatLead(upd.rows[0]);
    }

    // Insert new lead
    const cf = {
      aiCategory: cat,
      leadScore: score,
      tags: ['Voice Campaign', isAnswered ? 'Answered' : 'Retry'],
      lastCallAt: new Date(),
      callCount: 1,
      summary: summary || '',
      transcript: transcript || '',
    };

    const ins = await query(
      `INSERT INTO crm_leads (client_id, name, email, phone_number, company, stage, deal_value, notes, custom_fields, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING *`,
      [
        clientId,
        name || 'Qualified Lead',
        '',
        phoneNumber,
        'Direct Client',
        cat,
        dealVal,
        summary || '',
        JSON.stringify(cf),
      ]
    );

    return CrmService.formatLead(ins.rows[0]);
  }

  static async updateLeadCategory(clientId, leadId, newCategory) {
    const isNum = !isNaN(leadId);
    if (!isNum) return null;

    const rowRes = await query('SELECT * FROM crm_leads WHERE id = $1 AND client_id = $2', [
      parseInt(leadId, 10),
      clientId,
    ]);
    if (!rowRes.rows || rowRes.rows.length === 0) {
      throw new AppError('Lead not found', 404);
    }

    const row = rowRes.rows[0];
    const cf = typeof row.custom_fields === 'string' ? JSON.parse(row.custom_fields || '{}') : (row.custom_fields || {});
    cf.aiCategory = newCategory;

    const upd = await query(
      `UPDATE crm_leads
       SET stage = $1, custom_fields = $2, updated_at = NOW()
       WHERE id = $3 AND client_id = $4
       RETURNING *`,
      [newCategory, JSON.stringify(cf), parseInt(leadId, 10), clientId]
    );

    return CrmService.formatLead(upd.rows[0]);
  }
}
