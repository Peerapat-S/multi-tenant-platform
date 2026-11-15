const pool = require('../config/db');

// Model: ทุก query กรองด้วย tenant_id เสมอ
const COLUMNS = 'id, tenant_id, name, description, price, stock, created_at';

async function list(tenantId, { limit, offset }) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM products
      WHERE tenant_id = $1
      ORDER BY created_at DESC, id
      LIMIT $2 OFFSET $3`,
    [tenantId, limit, offset]
  );
  return rows;
}

async function findById(tenantId, id) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS} FROM products WHERE tenant_id = $1 AND id = $2`,
    [tenantId, id]
  );
  return rows[0] || null;
}

async function create(tenantId, { name, description = null, price, stock = 0 }) {
  const { rows } = await pool.query(
    `INSERT INTO products (tenant_id, name, description, price, stock)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${COLUMNS}`,
    [tenantId, name, description, price, stock]
  );
  return rows[0];
}

// อัปเดตเฉพาะ field ที่ส่งมา (field ที่เป็น undefined จะคงค่าเดิม)
async function update(tenantId, id, { name, description, price, stock }) {
  const { rows } = await pool.query(
    `UPDATE products
        SET name        = COALESCE($3, name),
            description = COALESCE($4, description),
            price       = COALESCE($5, price),
            stock       = COALESCE($6, stock)
      WHERE tenant_id = $1 AND id = $2
      RETURNING ${COLUMNS}`,
    [tenantId, id, name ?? null, description ?? null, price ?? null, stock ?? null]
  );
  return rows[0] || null;
}

async function remove(tenantId, id) {
  const { rowCount } = await pool.query(
    'DELETE FROM products WHERE tenant_id = $1 AND id = $2',
    [tenantId, id]
  );
  return rowCount > 0;
}

module.exports = { list, findById, create, update, remove };