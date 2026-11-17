const pool = require('../config/db');

// รายชื่อแบรนด์ที่เปิดใช้งาน (ส่ง slug/name/description)
async function listActive() {
  const { rows } = await pool.query(
    'SELECT slug, name, description FROM tenants WHERE is_active = TRUE ORDER BY name'
  );
  return rows;
}

// ค้นหาแบรนด์ตาม slug
async function findBySlug(slug, client = pool) {
  const { rows } = await client.query(
    `SELECT id, slug, name, description, is_active AS "isActive", created_at AS "createdAt"
       FROM tenants WHERE LOWER(slug) = LOWER($1)`,
    [slug]
  );
  return rows[0] || null;
}

// สร้างแบรนด์ใหม่
async function create({ name, slug, description = null, isActive = true }, client = pool) {
  const { rows } = await client.query(
    `INSERT INTO tenants (name, slug, description, is_active)
     VALUES ($1, $2, $3, $4)
     RETURNING id, slug, name, description, is_active AS "isActive", created_at AS "createdAt"`,
    [name, slug, description, isActive]
  );
  return rows[0];
}

// อัปเดตข้อมูลแบรนด์
async function update(id, { name, description, isActive }, client = pool) {
  const { rows } = await client.query(
    `UPDATE tenants
        SET name = COALESCE($2, name),
            description = COALESCE($3, description),
            is_active = COALESCE($4, is_active)
      WHERE id = $1
      RETURNING id, slug, name, description, is_active AS "isActive", created_at AS "createdAt"`,
    [id, name ?? null, description ?? null, isActive ?? null]
  );
  return rows[0] || null;
}

// ลบแบรนด์ (cascade ลบ users/products/orders ตาม FK)
async function remove(id, client = pool) {
  const { rowCount } = await client.query('DELETE FROM tenants WHERE id = $1', [id]);
  return rowCount > 0;
}

// รายชื่อแบรนด์ทั้งหมดพร้อมสถิติ (สำหรับ Super Admin)
async function listAll(client = pool) {
  const { rows } = await client.query(
    `SELECT t.id, t.slug, t.name, t.description, t.is_active AS "isActive", t.created_at AS "createdAt",
            COUNT(DISTINCT p.id)::int AS "productCount",
            COUNT(DISTINCT u.id)::int AS "userCount",
            COUNT(DISTINCT o.id)::int AS "orderCount"
       FROM tenants t
       LEFT JOIN products p ON p.tenant_id = t.id
       LEFT JOIN users u ON u.tenant_id = t.id
       LEFT JOIN orders o ON o.tenant_id = t.id
      GROUP BY t.id
      ORDER BY t.created_at DESC`
  );
  return rows;
}

module.exports = { listActive, findBySlug, create, update, remove, listAll };
