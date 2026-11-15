const Product = require('../models/product');
const HttpError = require('../utils/httpError');
const isUuid = require('../utils/isUuid');

function parsePaging({ page, limit } = {}) {
  const l = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const p = Math.max(parseInt(page, 10) || 1, 1);
  return { page: p, limit: l, offset: (p - 1) * l };
}

// ตรวจเฉพาะ field ที่ส่งมา; requireAll=true ใช้ตอนสร้าง
function validate(input, { requireAll }) {
  const out = {};

  if (input.name !== undefined || requireAll) {
    if (typeof input.name !== 'string' || !input.name.trim()) {
      throw new HttpError(400, 'Name is required');
    }
    out.name = input.name.trim();
  }
  if (input.description !== undefined) {
    if (typeof input.description !== 'string') {
      throw new HttpError(400, 'Description must be a string');
    }
    out.description = input.description;
  }
  if (input.price !== undefined || requireAll) {
    const price = Number(input.price);
    if (input.price === undefined || input.price === '' || !Number.isFinite(price) || price < 0) {
      throw new HttpError(400, 'Price must be a number >= 0');
    }
    out.price = price;
  }
  if (input.stock !== undefined) {
    const stock = Number(input.stock);
    if (!Number.isInteger(stock) || stock < 0) {
      throw new HttpError(400, 'Stock must be an integer >= 0');
    }
    out.stock = stock;
  }
  return out;
}

async function list(tenant, query) {
  const paging = parsePaging(query);
  const items = await Product.list(tenant.id, paging);
  return { items, page: paging.page, limit: paging.limit };
}

async function get(tenant, id) {
  const product = isUuid(id) ? await Product.findById(tenant.id, id) : null;
  if (!product) throw new HttpError(404, 'Product not found');
  return product;
}

async function create(tenant, input = {}) {
  return Product.create(tenant.id, validate(input, { requireAll: true }));
}

async function update(tenant, id, input = {}) {
  const fields = validate(input, { requireAll: false });
  if (Object.keys(fields).length === 0) {
    throw new HttpError(400, 'No fields to update');
  }
  const product = isUuid(id) ? await Product.update(tenant.id, id, fields) : null;
  if (!product) throw new HttpError(404, 'Product not found');
  return product;
}

async function remove(tenant, id) {
  const deleted = isUuid(id) ? await Product.remove(tenant.id, id) : false;
  if (!deleted) throw new HttpError(404, 'Product not found');
}

module.exports = { list, get, create, update, remove };