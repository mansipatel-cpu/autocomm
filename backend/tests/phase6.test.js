import request from 'supertest';
import { createApp } from '../src/app.js';
import { signAccessToken } from '../src/common/utils/jwt.util.js';
import { ROLES } from '../src/config/constants.js';

describe('Phase 6 - AI Voice Agents, Voice Library, Numbers, Calls & CRM Tests', () => {
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

  test('GET /api/v1/voice-library returns 21 curated voices', async () => {
    const res = await request(app)
      .get('/api/v1/voice-library')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(21);
    expect(res.body.data[0].id).toBe('rachel_warm_us');
  });

  test('GET /api/v1/agents requires authentication', async () => {
    const res = await request(app).get('/api/v1/agents');
    expect(res.status).toBe(401);
  });

  test('POST /api/v1/agents rejects empty agent name', async () => {
    const res = await request(app)
      .post('/api/v1/agents')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Agent name is required');
  });

  test('GET /api/v1/phone-numbers requires authentication', async () => {
    const res = await request(app).get('/api/v1/phone-numbers');
    expect(res.status).toBe(401);
  });

  test('GET /api/v1/calls requires authentication', async () => {
    const res = await request(app).get('/api/v1/calls');
    expect(res.status).toBe(401);
  });

  test('GET /api/v1/crm/pipeline requires authentication', async () => {
    const res = await request(app).get('/api/v1/crm/pipeline');
    expect(res.status).toBe(401);
  });

  test('POST /api/v1/crm/leads rejects empty lead name and phone', async () => {
    const res = await request(app)
      .post('/api/v1/crm/leads')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
