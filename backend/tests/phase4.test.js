import request from 'supertest';
import { createApp } from '../src/app.js';
import { signAccessToken } from '../src/common/utils/jwt.util.js';
import { ROLES } from '../src/config/constants.js';

describe('Phase 4 - Campaign Engine Tests', () => {
  let app;
  let clientToken;

  beforeAll(() => {
    app = createApp();
    clientToken = signAccessToken({
      id: '507f1f77bcf86cd799439044',
      name: 'Alex Vance',
      email: 'alex.vance@autocomm.io',
      role: ROLES.ADMIN,
      clientId: '507f1f77bcf86cd799439055',
    });
  });

  test('GET /api/v1/campaigns requires auth token', async () => {
    const res = await request(app).get('/api/v1/campaigns');
    expect(res.status).toBe(401);
  });

  test('GET /api/v1/campaigns/deleted requires auth token', async () => {
    const res = await request(app).get('/api/v1/campaigns/deleted');
    expect(res.status).toBe(401);
  });

  test('POST /api/v1/campaigns/whatsapp rejects empty campaign name', async () => {
    const res = await request(app)
      .post('/api/v1/campaigns/whatsapp')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Campaign name is required');
  });

  test('POST /api/v1/campaigns/voice rejects empty campaign name', async () => {
    const res = await request(app)
      .post('/api/v1/campaigns/voice')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Campaign name is required');
  });
});
