const Order = require('../models/order');
const Product = require('../models/product');
const HttpError = require('../utils/httpError');
const isUuid = require('../utils/isUuid');
const parsePaging = require('../utils/paging');
const withTransaction = require('../utils/withTransaction');

const MAX_LINES = 50;

// สถานะที่เปลี่ยนไปได้จากสถานะปัจจุบัน (shipped / cancelled เป็นสถานะสุดท้าย)
const TRANSITIONS = {
  pending: ['paid', 'cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: [],
  cancelled: [],
};

// ตรวจ body แล้วรวมรายการที่เป็นสินค้าเดียวกันให้เหลือบรรทัดเดียว (บวกจำนวน)
function parseItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, 'Items must be a non-empty array');
  }
  if (items.length > MAX_LINES) {
    throw new HttpError(400, `Too many items (max ${MAX_LINES})`);
  }

  const merged = new Map();
  for (const item of items) {
    if (!item || typeof item !== 'object' || !isUuid(item.productId)) {
      throw new HttpError(400, 'Each item needs a valid productId');
    }
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) {
      throw new HttpError(400, 'Quantity must be an integer >= 1');
    }
    const id = item.productId.toLowerCase();
    merged.set(id, (merged.get(id) || 0) + item.quantity);
  }
  return [...merged].map(([productId, quantity]) => ({ productId, quantity }));
}

// สร้างคำสั่งซื้อ: ล็อกสินค้า -> ตรวจสต็อก -> บันทึกออเดอร์ -> ตัดสต็อก ทั้งหมดอยู่ใน transaction เดียว
// ข้อผิดพลาดตรงไหนก็ตามจะ rollback ทั้งก้อน (ไม่มีออเดอร์ค้าง ไม่มีสต็อกที่ถูกตัดไปครึ่งเดียว)
async function create(tenant, user, input = {}) {
  const lines = parseItems(input.items);

  return withTransaction(async (client) => {
    const products = await Product.lockByIds(client, tenant.id, lines.map((l) => l.productId));
    const byId = new Map(products.map((p) => [p.id, p]));

    let totalCents = 0;
    const orderLines = [];
    for (const { productId, quantity } of lines) {
      const product = byId.get(productId);
      // ไม่พบ หรือเป็นสินค้าของแบรนด์อื่น (lockByIds กรองด้วย tenant_id แล้ว) -> 404 เหมือนกัน
      if (!product) throw new HttpError(404, 'Product not found');
      if (product.stock < quantity) {
        throw new HttpError(409, `Insufficient stock for "${product.name}"`);
      }
      // คิดเป็นสตางค์ (จำนวนเต็ม) กันปัญหาทศนิยมของ float เช่น 0.1 * 3
      totalCents += Math.round(Number(product.price) * 100) * quantity;
      orderLines.push({
        product_id: product.id,
        product_name: product.name,
        unit_price: product.price,
        quantity,
      });
    }

    const { id } = await Order.create(client, tenant.id, user.id, totalCents / 100);
    await Order.addItems(client, tenant.id, id, orderLines);
    for (const line of orderLines) {
      await Product.adjustStock(client, tenant.id, line.product_id, -line.quantity);
    }
    return Order.findById(tenant.id, id, { db: client });
  });
}

// ลูกค้าเห็นเฉพาะของตัวเอง, admin เห็นทั้งแบรนด์
function scopeOf(user) {
  return user.role === 'admin' ? null : user.id;
}

async function list(tenant, user, query) {
  const paging = parsePaging(query);
  const items = await Order.list(tenant.id, { userId: scopeOf(user), ...paging });
  return { items, page: paging.page, limit: paging.limit };
}

async function get(tenant, user, id) {
  if (!isUuid(id)) throw new HttpError(404, 'Order not found');
  const order = await Order.findById(tenant.id, id, { userId: scopeOf(user) });
  // ออเดอร์ของคนอื่นตอบ 404 เหมือนไม่มีอยู่ (ไม่ใช่ 403 จะได้ไม่บอกว่ามีออเดอร์นี้)
  if (!order) throw new HttpError(404, 'Order not found');
  return order;
}

async function updateStatus(tenant, id, status) {
  if (typeof status !== 'string' || !Object.hasOwn(TRANSITIONS, status)) {
    throw new HttpError(400, `Status must be one of: ${Object.keys(TRANSITIONS).join(', ')}`);
  }
  if (!isUuid(id)) throw new HttpError(404, 'Order not found');

  return withTransaction(async (client) => {
    const current = await Order.lockById(client, tenant.id, id);
    if (!current) throw new HttpError(404, 'Order not found');
    if (!TRANSITIONS[current.status].includes(status)) {
      throw new HttpError(409, `Cannot change status from ${current.status} to ${status}`);
    }

    // ยกเลิก = คืนสต็อก (ข้ามรายการที่สินค้าถูกลบไปแล้ว คือ product_id เป็น NULL)
    if (status === 'cancelled') {
      const items = await Order.findItems(client, tenant.id, [id]);
      const restock = items
        .filter((item) => item.product_id)
        .sort((a, b) => (a.product_id < b.product_id ? -1 : 1)); // ลำดับเดียวกับตอนล็อก กัน deadlock
      for (const item of restock) {
        await Product.adjustStock(client, tenant.id, item.product_id, item.quantity);
      }
    }

    await Order.setStatus(client, tenant.id, id, status);
    return Order.findById(tenant.id, id, { db: client });
  });
}

module.exports = { create, list, get, updateStatus, TRANSITIONS };
