import { db } from './database.js';

export class RegistrationRepository {
  static create({ fullName, email, phone, company, consent, consentTimestamp }) {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO registrations (
        full_name, email, phone, company, consent, consent_timestamp,
        status, contact_status, message_status, call_status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'registered', 'pending', 'pending', 'pending', ?, ?)
    `);

    const result = stmt.run(
      fullName,
      email,
      phone,
      company || null,
      consent ? 1 : 0,
      consentTimestamp,
      now,
      now
    );

    return this.findById(result.lastInsertRowid);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM registrations WHERE id = ?');
    return stmt.get(id);
  }

  static findByPhone(phone) {
    const stmt = db.prepare('SELECT * FROM registrations WHERE phone = ?');
    return stmt.get(phone);
  }

  static update(id, fields) {
    const allowed = [
      'status',
      'contact_status',
      'message_status',
      'call_status',
      'autocomm_contact_id',
      'autocomm_message_id',
      'autocomm_call_id',
      'last_error',
      'last_failed_step',
      'retry_count',
    ];

    const keys = Object.keys(fields).filter((k) => allowed.includes(k));
    if (keys.length === 0) return this.findById(id);

    const setClauses = keys.map((k) => `${k} = ?`).join(', ');
    const values = keys.map((k) => fields[k]);
    const now = new Date().toISOString();

    const sql = `UPDATE registrations SET ${setClauses}, updated_at = ? WHERE id = ?`;
    const stmt = db.prepare(sql);
    stmt.run(...values, now, id);

    return this.findById(id);
  }

  static list({ search, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      whereClause = `
        WHERE full_name LIKE ?
           OR phone LIKE ?
           OR email LIKE ?
           OR company LIKE ?
           OR status LIKE ?
           OR contact_status LIKE ?
           OR message_status LIKE ?
           OR call_status LIKE ?
      `;
      params.push(term, term, term, term, term, term, term, term);
    }

    const countSql = `SELECT COUNT(*) as total FROM registrations ${whereClause}`;
    const total = db.prepare(countSql).get(...params).total;

    const listSql = `
      SELECT * FROM registrations
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const rows = db.prepare(listSql).all(...params, limit, offset);

    return {
      rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  static getStats() {
    const total = db.prepare('SELECT COUNT(*) as count FROM registrations').get().count;
    const completed = db.prepare("SELECT COUNT(*) as count FROM registrations WHERE status = 'completed'").get().count;
    const failed = db.prepare("SELECT COUNT(*) as count FROM registrations WHERE status = 'failed'").get().count;
    const inProgress = db.prepare("SELECT COUNT(*) as count FROM registrations WHERE status IN ('registered', 'in_progress')").get().count;

    return { total, completed, failed, inProgress };
  }

  static delete(id) {
    const stmt = db.prepare('DELETE FROM registrations WHERE id = ?');
    return stmt.run(id);
  }

  static deleteAll() {
    const stmt = db.prepare('DELETE FROM registrations');
    return stmt.run();
  }

  static logWebhook({ registrationId, eventType, rawPayload, status }) {
    const stmt = db.prepare(`
      INSERT INTO webhook_logs (registration_id, event_type, raw_payload, status, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(registrationId || null, eventType, JSON.stringify(rawPayload), status || null, new Date().toISOString());
  }
}
