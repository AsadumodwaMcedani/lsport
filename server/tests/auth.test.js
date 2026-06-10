import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import bcrypt from 'bcrypt';

process.env.JWT_SECRET = 'test-secret';
process.env.ADMIN_EMAIL = 'admin@test.local';
process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('CorrectHorse9!', 4);

const { createApp } = await import('../src/app.js');
const app = createApp();

test('health endpoint responds', async () => {
  const r = await request(app).get('/api/v1/health');
  assert.equal(r.status, 200);
  assert.equal(r.body.ok, true);
});

test('admin login rejects bad password', async () => {
  const r = await request(app).post('/api/v1/auth/admin/login').send({ email: 'admin@test.local', password: 'wrong' });
  assert.equal(r.status, 401);
});

test('admin login succeeds and sets httpOnly cookie', async () => {
  const r = await request(app).post('/api/v1/auth/admin/login').send({ email: 'admin@test.local', password: 'CorrectHorse9!' });
  assert.equal(r.status, 200);
  const cookie = r.headers['set-cookie']?.[0] || '';
  assert.match(cookie, /ls_token=/);
  assert.match(cookie, /HttpOnly/);
});

test('protected route blocks without token', async () => {
  const r = await request(app).get('/api/v1/auth/me');
  assert.equal(r.status, 401);
});

// NOTE: admin login failure paths write to audit_logs; these two tests
// require a reachable test DB (lbbs_test). Skip cleanly if absent.
