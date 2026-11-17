// View: จัดรูป JSON (pg ส่ง NUMERIC เป็น string จึงแปลงเป็น number)
const toCents = (price) => Math.round(Number(price) * 100);

function item(i) {
  return {
    productId: i.product_id,
    name: i.product_name,
    unitPrice: Number(i.unit_price),
    quantity: i.quantity,
    lineTotal: (toCents(i.unit_price) * i.quantity) / 100,
  };
}

function order(o) {
  return {
    id: o.id,
    status: o.status,
    total: Number(o.total),
    customer: { name: o.customer_name, email: o.customer_email },
    items: (o.items || []).map(item),
    createdAt: o.created_at,
  };
}

function list({ items, page, limit }) {
  return { items: items.map(order), page, limit };
}

module.exports = { order, list };
