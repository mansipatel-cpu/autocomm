import request from 'supertest';
import { createApp } from '../src/app.js';
import { signSuperAdminToken } from '../src/common/utils/jwt.util.js';
import { ROLES } from '../src/config/constants.js';

describe('Phase 2 - Super Admin API Tests', () => {
  let app;
  let superAdminToken;

  beforeAll(() => {
    app = createApp();
    superAdminToken = signSuperAdminToken({
      id: '507f1f77bcf86cd799439011',
      name: 'Super Admin Test',
      email: 'superadmin@autocomm.io',
      role: ROLES.SUPER_ADMIN,
    });
  });

  test('GET /api/v1/superadmin/dashboard/metrics requires Super Admin auth', async () => {
    const res = await request(app).get('/api/v1/superadmin/dashboard/metrics');
    expect(res.status).toBe(401);
  });

  test('GET /api/v1/superadmin/clients returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/superadmin/clients');
    expect(res.status).toBe(401);
  });

  test('GET /api/v1/superadmin/email-templates returns 401 without token', async () => {
    const res = await request(app).get('/api/v1/superadmin/email-templates');
    expect(res.status).toBe(401);
  });
});
