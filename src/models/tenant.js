const pool = require('../config/db');

// รายชื่อแบรนด์ที่เปิดใช้งาน (ส่งเฉพาะ slug/name ไม่ส่ง id)
async function listActive() {
  const { rows } = await pool.query(
    'SELECT slug, name FROM tenants WHERE is_active = TRUE ORDER BY name'
  );
  return rows;
}

module.exports = { listActive };