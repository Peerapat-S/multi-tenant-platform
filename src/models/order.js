const pool = require('../config/db');

// Model: ทุก query กรองด้วย tenant_id เสมอ
// ฟังก์ชันที่รับ db เป็นพารามิเตอร์ตัวแรกใช้ใน transaction (db = client)
// ส่วนฟังก์ชันที่อ่านอย่างเดียวใช้ pool เป็นค่าเริ่มต้น

const ORDER_SELECT = `
  SELECT o.id, o.tenant_id, o.user_id, o.status, o.total, o.created_at,
         u.name AS customer_name, u.email AS customer_email
    FROM orders o
    JOIN users u ON u.id = o.user_id AND u.tenant_id = o.tenant_id`;

async function create(db, tenantId, userId, total) {
  const { rows } = await db.query(
    `INSERT INTO orders (tenant_id, user_id, total)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [tenantId, userId, total]
  );
  return rows[0];
}

// lines: [{ product_id, product_name, unit_price, quantity }]
// เก็บชื่อและราคา ณ ตอนสั่งไว้ในแถว (snapshot) แก้ราคาสินค้าทีหลังจึงไม่กระทบคำสั่งซื้อเก่า
async function addItems(db, tenantId, orderId, lines) {
  for (let i = 0; i < lines.length; i += 1) {
    const l = lines[i];
    await db.query(
      `INSERT INTO order_items (tenant_id, order_id, product_id, product_name, unit_price, quantity, line_no)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [tenantId, orderId, l.product_id, l.product_name, l.unit_price, l.quantity, i]
    );
  }
}

async function findItems(db, tenantId, orderIds) {
  if (orderIds.length === 0) return [];
  const { rows } = await db.query(
    `SELECT order_id, product_id, product_name, unit_price, quantity
       FROM order_items
      WHERE tenant_id = $1 AND order_id = ANY($2::uuid[])
      ORDER BY line_no`,
    [tenantId, orderIds]
  );
  return rows;
}

// ดึงรายการสินค้าของหลายออเดอร์ในครั้งเดียว (แทนการ query ทีละออเดอร์) แล้วแนบเข้าแต่ละออเดอร์
async function withItems(db, tenantId, orders) {
  const items = await findItems(db, tenantId, orders.map((o) => o.id));
  const byOrder = new Map();
  for (const item of items) {
    if (!byOrder.has(item.order_id)) byOrder.set(item.order_id, []);
    byOrder.get(item.order_id).push(item);
  }
  return orders.map((o) => ({ ...o, items: byOrder.get(o.id) || [] }));
}

// userId = null -> ทุกคนในแบรนด์ (ใช้กับ admin), มีค่า -> เฉพาะของ user นั้น
async function list(tenantId, { userId = null, limit, offset }) {
  const { rows } = await pool.query(
    `${ORDER_SELECT}
      WHERE o.tenant_id = $1 AND ($2::uuid IS NULL OR o.user_id = $2)
      ORDER BY o.created_at DESC, o.id
      LIMIT $3 OFFSET $4`,
    [tenantId, userId, limit, offset]
  );
  return withItems(pool, tenantId, rows);
}

async function findById(tenantId, id, { userId = null, db = pool } = {}) {
  const { rows } = await db.query(
    `${ORDER_SELECT}
      WHERE o.tenant_id = $1 AND o.id = $2 AND ($3::uuid IS NULL OR o.user_id = $3)`,
    [tenantId, id, userId]
  );
  if (rows.length === 0) return null;
  const [order] = await withItems(db, tenantId, rows);
  return order;
}

// ล็อกออเดอร์ก่อนเปลี่ยนสถานะ กัน admin สองคนกดพร้อมกัน (เช่น ยกเลิกซ้ำแล้วคืนสต็อกสองรอบ)
async function lockById(db, tenantId, id) {
  const { rows } = await db.query(
    'SELECT id, status FROM orders WHERE tenant_id = $1 AND id = $2 FOR UPDATE',
    [tenantId, id]
  );
  return rows[0] || null;
}

async function setStatus(db, tenantId, id, status) {
  await db.query('UPDATE orders SET status = $3 WHERE tenant_id = $1 AND id = $2', [tenantId, id, status]);
}

module.exports = { create, addItems, findItems, list, findById, lockById, setStatus };
