const pool = require('../config/db');

// Model: ทุก query กรองด้วย tenant_id เสมอ
const COLUMNS = 'id, tenant_id, name, description, price, stock, image_url, created_at';

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

async function create(tenantId, { name, description = null, price, stock = 0, image_url = null }) {
  const { rows } = await pool.query(
    `INSERT INTO products (tenant_id, name, description, price, stock, image_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${COLUMNS}`,
    [tenantId, name, description, price, stock, image_url]
  );
  return rows[0];
}

// อัปเดตเฉพาะ field ที่ส่งมา (field ที่เป็น undefined จะคงค่าเดิม)
// image_url: undefined = คงเดิม, null = ลบรูป, string = ตั้งค่าใหม่
// (COALESCE ใช้กับ image_url ไม่ได้ เพราะต้องแยก "ไม่ส่งมา" ออกจาก "ต้องการลบรูป")
async function update(tenantId, id, { name, description, price, stock, image_url }) {
  const { rows } = await pool.query(
    `UPDATE products
        SET name        = COALESCE($3, name),
            description = COALESCE($4, description),
            price       = COALESCE($5, price),
            stock       = COALESCE($6, stock),
            image_url   = CASE WHEN $7::boolean THEN $8::text ELSE image_url END
      WHERE tenant_id = $1 AND id = $2
      RETURNING ${COLUMNS}`,
    [
      tenantId, id,
      name ?? null, description ?? null, price ?? null, stock ?? null,
      image_url !== undefined, image_url ?? null,
    ]
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

// ---- ใช้ภายใน transaction ของคำสั่งซื้อ (รับ db = client ของ transaction) ----

// ล็อกแถวสินค้า (FOR UPDATE) เพื่อให้คำสั่งซื้อที่เข้ามาพร้อมกันต้องรอกัน ไม่ตัดสต็อกซ้อน
// เรียงตาม id เสมอ เพื่อไม่ให้สอง transaction ล็อกสินค้าคนละลำดับแล้ว deadlock
async function lockByIds(db, tenantId, ids) {
  const { rows } = await db.query(
    `SELECT ${COLUMNS} FROM products
      WHERE tenant_id = $1 AND id = ANY($2::uuid[])
      ORDER BY id
      FOR UPDATE`,
    [tenantId, ids]
  );
  return rows;
}

// delta เป็นลบ = ตัดสต็อก, เป็นบวก = คืนสต็อก (CHECK stock >= 0 ในตารางเป็นด่านสุดท้ายกันสต็อกติดลบ)
async function adjustStock(db, tenantId, id, delta) {
  const { rowCount } = await db.query(
    'UPDATE products SET stock = stock + $3 WHERE tenant_id = $1 AND id = $2',
    [tenantId, id, delta]
  );
  return rowCount > 0;
}

module.exports = { list, findById, create, update, remove, lockByIds, adjustStock };