import { Router } from 'express';
import { query } from '../../config/postgres.js';
import { authenticate } from '../../common/middlewares/auth.middleware.js';

const router = Router();

// GET all analytics scripts
router.get('/analytics-scripts', authenticate, async (_req, res) => {
  try {
    const result = await query(
      `SELECT * FROM analytics_scripts ORDER BY load_priority DESC, created_at DESC`
    );
    const scripts = (result.rows || []).map((script) => ({
      id: script.id,
      name: script.name,
      type: script.type,
      code: script.code,
      headCode: script.head_code,
      bodyCode: script.body_code,
      placement: script.placement || ['head'],
      loadPriority: script.load_priority || 0,
      async: script.async,
      defer: script.defer,
      enabled: script.enabled,
      hideOnInternalPages: script.hide_on_internal_pages,
      description: script.description,
      createdAt: script.created_at,
      updatedAt: script.updated_at,
    }));
    res.json(scripts);
  } catch (error) {
    console.error('Error fetching admin analytics scripts:', error);
    res.status(500).json({ error: 'Failed to fetch analytics scripts' });
  }
});

// CREATE analytics script
router.post('/analytics-scripts', authenticate, async (req, res) => {
  try {
    const {
      name,
      type,
      code,
      headCode,
      bodyCode,
      placement,
      loadPriority,
      async: asyncLoad,
      defer,
      enabled,
      hideOnInternalPages,
      description,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const effectiveCode = code || headCode || bodyCode || '';
    const scriptPlacement = placement ? (Array.isArray(placement) ? placement : [placement]) : ['head'];

    const result = await query(
      `INSERT INTO analytics_scripts (
        name, type, code, head_code, body_code, placement, load_priority, async, defer, enabled, hide_on_internal_pages, description, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        name,
        type || 'custom',
        effectiveCode,
        headCode || null,
        bodyCode || null,
        scriptPlacement,
        loadPriority || 0,
        asyncLoad || false,
        defer || false,
        enabled !== false,
        hideOnInternalPages || false,
        description || null,
        req.user?.id ? String(req.user.id) : null,
      ]
    );

    const script = result.rows[0];
    res.json({
      id: script.id,
      name: script.name,
      type: script.type,
      code: script.code,
      headCode: script.head_code,
      bodyCode: script.body_code,
      placement: script.placement,
      loadPriority: script.load_priority,
      async: script.async,
      defer: script.defer,
      enabled: script.enabled,
      hideOnInternalPages: script.hide_on_internal_pages,
      description: script.description,
      createdAt: script.created_at,
      updatedAt: script.updated_at,
    });
  } catch (error) {
    console.error('Error creating analytics script:', error);
    res.status(500).json({ error: 'Failed to create analytics script' });
  }
});

// UPDATE analytics script
router.patch('/analytics-scripts/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      code,
      headCode,
      bodyCode,
      placement,
      loadPriority,
      async: asyncLoad,
      defer,
      enabled,
      hideOnInternalPages,
      description,
    } = req.body;

    const updates = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) { updates.push(`name = $${idx++}`); values.push(name); }
    if (type !== undefined) { updates.push(`type = $${idx++}`); values.push(type); }
    if (code !== undefined) { updates.push(`code = $${idx++}`); values.push(code); }
    if (headCode !== undefined) { updates.push(`head_code = $${idx++}`); values.push(headCode); }
    if (bodyCode !== undefined) { updates.push(`body_code = $${idx++}`); values.push(bodyCode); }
    if (placement !== undefined) {
      updates.push(`placement = $${idx++}`);
      values.push(Array.isArray(placement) ? placement : [placement]);
    }
    if (loadPriority !== undefined) { updates.push(`load_priority = $${idx++}`); values.push(loadPriority); }
    if (asyncLoad !== undefined) { updates.push(`async = $${idx++}`); values.push(asyncLoad); }
    if (defer !== undefined) { updates.push(`defer = $${idx++}`); values.push(defer); }
    if (enabled !== undefined) { updates.push(`enabled = $${idx++}`); values.push(enabled); }
    if (hideOnInternalPages !== undefined) { updates.push(`hide_on_internal_pages = $${idx++}`); values.push(hideOnInternalPages); }
    if (description !== undefined) { updates.push(`description = $${idx++}`); values.push(description); }

    updates.push(`updated_at = NOW()`);

    values.push(id);
    await query(
      `UPDATE analytics_scripts SET ${updates.join(', ')} WHERE id = $${idx}`,
      values
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating analytics script:', error);
    res.status(500).json({ error: 'Failed to update analytics script' });
  }
});

// DELETE analytics script
router.delete('/analytics-scripts/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await query(`DELETE FROM analytics_scripts WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting analytics script:', error);
    res.status(500).json({ error: 'Failed to delete analytics script' });
  }
});

export default router;
