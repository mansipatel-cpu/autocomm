import request from 'supertest';
import { createApp } from '../src/app.js';
import { signAccessToken } from '../src/common/utils/jwt.util.js';
import { ROLES } from '../src/config/constants.js';

describe('Phase 3 - Contacts, Groups, Templates & Channels Tests', () => {
  let app;
  let clientToken;

  beforeAll(() => {
    app = createApp();
    clientToken = signAccessToken({
      id: '507f1f77bcf86cd799439022',
      name: 'Alex Vance',
      email: 'alex.vance@autocomm.io',
      role: ROLES.ADMIN,
      clientId: '507f1f77bcf86cd799439033',
    });
  });

  test('GET /api/v1/contacts requires auth token', async () => {
    const res = await request(app).get('/api/v1/contacts');
    expect(res.status).toBe(401);
  });

  test('GET /api/v1/groups requires auth token', async () => {
    const res = await request(app).get('/api/v1/groups');
    expect(res.status).toBe(401);
  });

  test('GET /api/v1/templates requires auth token', async () => {
    const res = await request(app).get('/api/v1/templates');
    expect(res.status).toBe(401);
  });

  test('GET /api/v1/channels requires auth token', async () => {
    const res = await request(app).get('/api/v1/channels');
    expect(res.status).toBe(401);
  });

  test('POST /api/v1/templates/whatsapp rejects invalid non-lowercase name', async () => {
    const res = await request(app)
      .post('/api/v1/templates/whatsapp')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        name: 'INVALID NAME WITH SPACES',
        category: 'Marketing',
        bodyText: 'Hello world',
      });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
