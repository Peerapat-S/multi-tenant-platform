const pool = require('../config/db');

// Model: คุยกับฐานข้อมูลอย่างเดียว ทุก query ต้องมี tenant_id เสมอ

async function findByEmail(tenantId, email) {
  const { rows } = await pool.query(
    `SELECT id, tenant_id, email, password_hash, name, role, created_at
       FROM users
      WHERE tenant_id = $1 AND email = $2`,
    [tenantId, email]
  );
  return rows[0] || null;
}

async function findById(tenantId, id) {
  const { rows } = await pool.query(
    `SELECT id, tenant_id, email, name, role, created_at
       FROM users
      WHERE tenant_id = $1 AND id = $2`,
    [tenantId, id]
  );
  return rows[0] || null;
}

async function create({ tenantId, email, passwordHash, name, role = 'customer' }) {
  const { rows } = await pool.query(
    `INSERT INTO users (tenant_id, email, password_hash, name, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, tenant_id, email, name, role, created_at`,
    [tenantId, email, passwordHash, name, role]
  );
  return rows[0];
}

module.exports = { findByEmail, findById, create };