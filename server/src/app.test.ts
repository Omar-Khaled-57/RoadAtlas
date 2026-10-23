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
    expect(typeof res.body.uptimeSeconds).toBe('number');
  });

  it('returns 404 JSON for unknown API routes', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/^Not found: GET \/api\/nope$/);
    expect(res.body.requestId).toBe(res.headers['x-request-id']);
  });

  it('generates a request id and reuses a valid caller-supplied one', async () => {
    const generated = await request(app).get('/api/health');
    expect(generated.headers['x-request-id']).toMatch(/^[A-Za-z0-9._-]{8,64}$/);

    const supplied = await request(app).get('/api/health').set('X-Request-Id', 'trace-1234-abcd');
    expect(supplied.headers['x-request-id']).toBe('trace-1234-abcd');

    const rejected = await request(app).get('/api/health').set('X-Request-Id', 'bad id!');
    expect(rejected.headers['x-request-id']).not.toBe('bad id!');
    expect(rejected.headers['x-request-id']).toMatch(/^[A-Za-z0-9._-]{8,64}$/);
  });

  it('sets security headers via helmet', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['cross-origin-resource-policy']).toBeDefined();
  });

  it('rejects state-changing requests from another origin', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', 'https://evil.example')
      .send({ email: 'owner@example.com', password: 'wrong-password' });
    expect(res.status).toBe(403);
  });

  it('reports whether persistence is configured', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.database).toBe('connected');
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
        .set('Origin', process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
        .send({ email: 'owner@example.com', password: 'wrong-password' });
    }
    expect(last.status).toBe(429);
  });
});
