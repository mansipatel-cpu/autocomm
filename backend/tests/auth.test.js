import request from 'supertest';
import { createApp } from '../src/app.js';

describe('AutoComm API Baseline Tests', () => {
  let app;

  beforeAll(() => {
    app = createApp();
  });

  test('GET /health returns healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('AutoComm Unified API');
  });

  test('POST /api/v1/auth/login validates required fields', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/v1/superadmin/auth/login validates required fields', async () => {
    const res = await request(app)
      .post('/api/v1/superadmin/auth/login')
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('GET non-existent endpoint returns 404', async () => {
    const res = await request(app).get('/api/v1/unknown-endpoint');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
