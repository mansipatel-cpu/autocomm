import request from 'supertest';
import { createApp } from '../src/app.js';
import { signAccessToken } from '../src/common/utils/jwt.util.js';
import { ROLES } from '../src/config/constants.js';

describe('Phase 5 - Team Inbox, AI Settings, Knowledge Base & Webhook Tests', () => {
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

  test('GET /api/v1/inbox/conversations requires authentication', async () => {
    const res = await request(app).get('/api/v1/inbox/conversations');
    expect(res.status).toBe(401);
  });

  test('GET /api/v1/ai-settings requires authentication', async () => {
    const res = await request(app).get('/api/v1/ai-settings');
    expect(res.status).toBe(401);
  });

  test('GET /api/v1/knowledge-base requires authentication', async () => {
    const res = await request(app).get('/api/v1/knowledge-base');
    expect(res.status).toBe(401);
  });

  test('GET /api/v1/webhooks/whatsapp verifies challenge successfully', async () => {
    const res = await request(app)
      .get('/api/v1/webhooks/whatsapp')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'autocomm_meta_secret_token',
        'hub.challenge': 'CHALLENGE_ACCEPTED_123',
      });
    expect(res.status).toBe(200);
    expect(res.text).toBe('CHALLENGE_ACCEPTED_123');
  });

  test('GET /api/v1/webhooks/whatsapp rejects invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/webhooks/whatsapp')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'wrong_token',
        'hub.challenge': 'CHALLENGE_ACCEPTED_123',
      });
    expect(res.status).toBe(403);
  });

  test('POST /api/v1/webhooks/whatsapp acknowledges event with 200', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks/whatsapp')
      .send({ object: 'whatsapp_business_account', entry: [] });
    expect(res.status).toBe(200);
    expect(res.text).toBe('EVENT_RECEIVED');
  });

  test('POST /api/v1/knowledge-base/text rejects empty title and content', async () => {
    const res = await request(app)
      .post('/api/v1/knowledge-base/text')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
