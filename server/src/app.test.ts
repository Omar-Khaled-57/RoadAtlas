import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './app';

const app = createApp();

describe('createApp', () => {
  it('serves health', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('roadatlas-api');
    expect(typeof res.body.time).toBe('string');
  });

  it('returns 404 JSON for unknown API routes', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/^Not found: GET \/api\/nope$/);
  });

  it('sets security headers via helmet', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['cross-origin-resource-policy']).toBeDefined();
  });

  it('disables trust proxy outside production', () => {
    expect(app.get('trust proxy')).toBe(false);
  });

  it('returns 429 after exceeding the auth rate limit', async () => {
    const limited = createApp();
    let last = { status: 0 };
    for (let i = 0; i < 21; i++) {
      last = await request(limited)
        .post('/api/auth/login')
        .send({ email: 'owner@example.com', password: 'wrong-password' });
    }
    expect(last.status).toBe(429);
  });
});
