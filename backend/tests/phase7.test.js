import request from 'supertest';
import { createApp } from '../src/app.js';
import { signAccessToken, signSuperAdminToken } from '../src/common/utils/jwt.util.js';
import { ROLES } from '../src/config/constants.js';

describe('Phase 7 - Analytics, API Documentation, Flow Builder & Monitoring Tests', () => {
  let app;
  let clientToken;
  let superAdminToken;

  beforeAll(() => {
    app = createApp();
    clientToken = signAccessToken({
      id: '507f1f77bcf86cd799439044',
      name: 'Alex Vance',
      email: 'alex.vance@autocomm.io',
      role: ROLES.ADMIN,
      clientId: '507f1f77bcf86cd799439055',
    });
    superAdminToken = signSuperAdminToken({
      id: '507f1f77bcf86cd799439099',
      name: 'Root Admin',
      email: 'root@autocomm.io',
      role: ROLES.SUPER_ADMIN,
    });
  });

  test('GET /api/v1/analytics requires authentication', async () => {
    const res = await request(app).get('/api/v1/analytics');
    expect(res.status).toBe(401);
  });

  test('GET /api/v1/analytics returns metrics with valid token', async () => {
    const res = await request(app)
      .get('/api/v1/analytics')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.whatsapp).toBeDefined();
    expect(res.body.data.voice).toBeDefined();
  });

  test('POST /api/v1/api-keys creates a new secret API key', async () => {
    const res = await request(app)
      .post('/api/v1/api-keys')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ name: 'Zapier Webhook Key' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.plainApiKey).toMatch(/^ac_live_/);
  });

  test('GET /api/v1/superadmin/flows requires superadmin auth', async () => {
    const res = await request(app).get('/api/v1/superadmin/flows');
    expect(res.status).toBe(401);
  });

  test('GET /api/v1/superadmin/flows returns flow list with superadmin token', async () => {
    const res = await request(app)
      .get('/api/v1/superadmin/flows')
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('GET /api/v1/superadmin/monitoring/metrics returns server and queue status', async () => {
    const res = await request(app)
      .get('/api/v1/superadmin/monitoring/metrics')
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.server).toBeDefined();
    expect(res.body.data.databases).toBeDefined();
  });

  test('GET /api/v1/superadmin/monitoring/reports returns platform aggregate stats', async () => {
    const res = await request(app)
      .get('/api/v1/superadmin/monitoring/reports')
      .set('Authorization', `Bearer ${superAdminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary).toBeDefined();
  });
});
