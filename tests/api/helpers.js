const request = require('supertest');
const app = require('../../src/app');
const pool = require('../../src/config/db');

// ข้อมูลที่เทสต์สร้างจะขึ้นต้นด้วย apitest- เพื่อให้ลบทิ้งได้
const PREFIX = 'apitest-';
const unique = (label) => `${PREFIX}${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const uniqueEmail = () => `${unique('user')}@test.com`;

const api = () => request(app);

async function register(tenant, body) {
  return api().post('/api/auth/register').set('X-Tenant-ID', tenant).send(body);
}

async function login(tenant, email, password) {
  const res = await api().post('/api/auth/login').set('X-Tenant-ID', tenant).send({ email, password });
  if (res.status !== 200) {
    throw new Error(`login failed for ${email} @ ${tenant}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.token;
}

async function cleanup() {
  await pool.query('DELETE FROM products WHERE name LIKE $1', [`${PREFIX}%`]);
  await pool.query('DELETE FROM users WHERE email LIKE $1', [`${PREFIX}%`]);
}

module.exports = { api, pool, register, login, cleanup, unique, uniqueEmail, PREFIX };