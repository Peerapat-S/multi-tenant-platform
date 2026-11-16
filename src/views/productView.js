// View: จัดรูป JSON (pg ส่ง NUMERIC เป็น string จึงแปลงเป็น number)
function product(p) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    stock: p.stock,
    imageUrl: p.image_url ?? null,
    createdAt: p.created_at,
  };
}

function list({ items, page, limit }) {
  return { items: items.map(product), page, limit };
}

module.exports = { product, list };