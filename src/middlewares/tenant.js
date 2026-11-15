const pool = require('../config/db');

// อ่านแบรนด์จาก header X-Tenant-ID (ค่าคือ slug เช่น "brand-a")
// แล้วใส่ไว้ที่ req.tenant เพื่อให้ controller/model ใช้ tenant_id กรองข้อมูล
async function tenantResolver(req, res, next) {
  try {
    const slug = req.header('X-Tenant-ID');
    if (!slug) {
      return res.status(400).json({ error: 'Missing X-Tenant-ID header' });
    }

    const { rows } = await pool.query(
      'SELECT id, slug, name FROM tenants WHERE slug = $1 AND is_active = TRUE',
      [slug.trim().toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    req.tenant = rows[0];
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = tenantResolver;