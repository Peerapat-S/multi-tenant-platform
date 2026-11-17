const { api, pool, register, login, cleanup, unique, uniqueEmail } = require('./helpers');

const ADMIN_PASSWORD = 'Admin1234';
let adminA, adminB, customerA1, customerA2, customerB; // token

const as = (tenant, token) => (req) =>
  req.set('X-Tenant-ID', tenant).set('Authorization', `Bearer ${token}`);

async function newCustomer(tenant) {
  const email = uniqueEmail();
  await register(tenant, { email, password: '12345678', name: 'Customer' });
  return login(tenant, email, '12345678');
}

async function newProduct(tenant, token, fields = {}) {
  const res = await as(tenant, token)(api().post('/api/products'))
    .send({ name: unique('item'), price: 100, stock: 10, ...fields });
  return res.body.product;
}

const stockOf = async (tenant, id) =>
  (await api().get(`/api/products/${id}`).set('X-Tenant-ID', tenant)).body.product.stock;

const placeOrder = (tenant, token, items) =>
  as(tenant, token)(api().post('/api/orders')).send({ items });

const listOrders = async (tenant, token) =>
  (await as(tenant, token)(api().get('/api/orders'))).body.items;

beforeAll(async () => {
  await cleanup();
  adminA = await login('brand-a', 'admin@brand-a.com', ADMIN_PASSWORD);
  adminB = await login('brand-b', 'admin@brand-b.com', ADMIN_PASSWORD);
  customerA1 = await newCustomer('brand-a');
  customerA2 = await newCustomer('brand-a');
  customerB = await newCustomer('brand-b');
});

afterAll(async () => {
  await cleanup();
  await pool.end();
});

describe('สิทธิ์การเข้าถึง', () => {
  test('ไม่มี token -> 401 ทุก endpoint', async () => {
    const t = (r) => r.set('X-Tenant-ID', 'brand-a');
    expect((await t(api().post('/api/orders')).send({ items: [] })).status).toBe(401);
    expect((await t(api().get('/api/orders'))).status).toBe(401);
    expect((await t(api().get('/api/orders/abc'))).status).toBe(401);
    expect((await t(api().patch('/api/orders/abc/status')).send({ status: 'paid' })).status).toBe(401);
  });

  test('ไม่มี X-Tenant-ID -> 400', async () => {
    const res = await api().get('/api/orders').set('Authorization', `Bearer ${customerA1}`);
    expect(res.status).toBe(400);
  });

  test('admin สั่งซื้อไม่ได้ (เฉพาะ customer) -> 403', async () => {
    const p = await newProduct('brand-a', adminA);
    const res = await placeOrder('brand-a', adminA, [{ productId: p.id, quantity: 1 }]);
    expect(res.status).toBe(403);
    expect(await stockOf('brand-a', p.id)).toBe(10);
  });

  test('customer เปลี่ยนสถานะออเดอร์ไม่ได้ -> 403', async () => {
    const p = await newProduct('brand-a', adminA);
    const created = await placeOrder('brand-a', customerA1, [{ productId: p.id, quantity: 1 }]);
    const res = await as('brand-a', customerA1)(api().patch(`/api/orders/${created.body.order.id}/status`))
      .send({ status: 'paid' });
    expect(res.status).toBe(403);
  });

  test('token ของแบรนด์ A ใช้กับแบรนด์ B ไม่ได้ -> 403', async () => {
    const res = await as('brand-b', customerA1)(api().get('/api/orders'));
    expect(res.status).toBe(403);
  });
});

describe('POST /api/orders', () => {
  test('สั่งซื้อสำเร็จ: คิดยอดรวม เก็บราคา ณ ตอนสั่ง และตัดสต็อก', async () => {
    const shirt = await newProduct('brand-a', adminA, { price: 100, stock: 10 });
    const pen = await newProduct('brand-a', adminA, { price: 49.5, stock: 5 });

    const res = await placeOrder('brand-a', customerA1, [
      { productId: shirt.id, quantity: 2 },
      { productId: pen.id, quantity: 1 },
    ]);

    expect(res.status).toBe(201);
    expect(res.body.order).toMatchObject({ status: 'pending', total: 249.5 });
    expect(res.body.order.items).toEqual([
      { productId: shirt.id, name: shirt.name, unitPrice: 100, quantity: 2, lineTotal: 200 },
      { productId: pen.id, name: pen.name, unitPrice: 49.5, quantity: 1, lineTotal: 49.5 },
    ]);
    expect(res.body.order.customer.email).toMatch(/^apitest-/);

    expect(await stockOf('brand-a', shirt.id)).toBe(8);
    expect(await stockOf('brand-a', pen.id)).toBe(4);
  });

  test('สินค้าชิ้นเดียวกันหลายบรรทัด -> รวมจำนวนเป็นบรรทัดเดียว', async () => {
    const p = await newProduct('brand-a', adminA, { stock: 10 });
    const res = await placeOrder('brand-a', customerA1, [
      { productId: p.id, quantity: 1 },
      { productId: p.id, quantity: 2 },
    ]);
    expect(res.status).toBe(201);
    expect(res.body.order.items).toHaveLength(1);
    expect(res.body.order.items[0].quantity).toBe(3);
    expect(await stockOf('brand-a', p.id)).toBe(7);
  });

  test('สต็อกไม่พอ -> 409 และสต็อกไม่ถูกตัด', async () => {
    const p = await newProduct('brand-a', adminA, { stock: 2 });
    const before = (await listOrders('brand-a', customerA2)).length;

    const res = await placeOrder('brand-a', customerA2, [{ productId: p.id, quantity: 3 }]);

    expect(res.status).toBe(409);
    expect(await stockOf('brand-a', p.id)).toBe(2);
    expect((await listOrders('brand-a', customerA2)).length).toBe(before);
  });

  test('สั่งได้พอดีกับสต็อกที่เหลือ', async () => {
    const p = await newProduct('brand-a', adminA, { stock: 3 });
    const res = await placeOrder('brand-a', customerA1, [{ productId: p.id, quantity: 3 }]);
    expect(res.status).toBe(201);
    expect(await stockOf('brand-a', p.id)).toBe(0);
  });

  test('transaction: บรรทัดหนึ่งสต็อกไม่พอ -> rollback ทั้งออเดอร์ (บรรทัดที่ผ่านก็ไม่ถูกตัด)', async () => {
    const ok = await newProduct('brand-a', adminA, { stock: 10 });
    const low = await newProduct('brand-a', adminA, { stock: 1 });
    const before = (await listOrders('brand-a', customerA2)).length;

    const res = await placeOrder('brand-a', customerA2, [
      { productId: ok.id, quantity: 4 },
      { productId: low.id, quantity: 5 },
    ]);

    expect(res.status).toBe(409);
    expect(await stockOf('brand-a', ok.id)).toBe(10);
    expect(await stockOf('brand-a', low.id)).toBe(1);
    expect((await listOrders('brand-a', customerA2)).length).toBe(before);
  });

  test('สั่งพร้อมกันบนสินค้าชิ้นสุดท้าย -> สำเร็จได้แค่คนเดียว (ไม่ขายเกินสต็อก)', async () => {
    const p = await newProduct('brand-a', adminA, { stock: 1 });
    const results = await Promise.all([
      placeOrder('brand-a', customerA1, [{ productId: p.id, quantity: 1 }]),
      placeOrder('brand-a', customerA2, [{ productId: p.id, quantity: 1 }]),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await stockOf('brand-a', p.id)).toBe(0);
  });

  test('สินค้าของแบรนด์อื่น -> 404 และสต็อกของแบรนด์นั้นไม่เปลี่ยน', async () => {
    const pB = await newProduct('brand-b', adminB, { stock: 5 });
    const res = await placeOrder('brand-a', customerA1, [{ productId: pB.id, quantity: 1 }]);
    expect(res.status).toBe(404);
    expect(await stockOf('brand-b', pB.id)).toBe(5);
  });

  test('สินค้าที่ไม่มีอยู่ -> 404', async () => {
    const res = await placeOrder('brand-a', customerA1, [
      { productId: '00000000-0000-4000-8000-000000000000', quantity: 1 },
    ]);
    expect(res.status).toBe(404);
  });

  test.each([
    ['ไม่ส่ง items', undefined],
    ['items ว่าง', []],
    ['items ไม่ใช่ array', 'abc'],
    ['productId ไม่ใช่ UUID', [{ productId: 'abc', quantity: 1 }]],
    ['quantity เป็น 0', [{ productId: '00000000-0000-4000-8000-000000000000', quantity: 0 }]],
    ['quantity ติดลบ', [{ productId: '00000000-0000-4000-8000-000000000000', quantity: -1 }]],
    ['quantity เป็นทศนิยม', [{ productId: '00000000-0000-4000-8000-000000000000', quantity: 1.5 }]],
    ['quantity เป็นสตริง', [{ productId: '00000000-0000-4000-8000-000000000000', quantity: '2' }]],
  ])('ข้อมูลไม่ถูกต้อง (%s) -> 400', async (_label, items) => {
    const res = await placeOrder('brand-a', customerA1, items);
    expect(res.status).toBe(400);
  });

  test('แก้ราคาสินค้าทีหลัง ออเดอร์เก่ายังเป็นราคาตอนสั่ง', async () => {
    const p = await newProduct('brand-a', adminA, { price: 100, stock: 5 });
    const created = await placeOrder('brand-a', customerA1, [{ productId: p.id, quantity: 1 }]);

    await as('brand-a', adminA)(api().put(`/api/products/${p.id}`)).send({ price: 999 });

    const res = await as('brand-a', customerA1)(api().get(`/api/orders/${created.body.order.id}`));
    expect(res.status).toBe(200);
    expect(res.body.order.total).toBe(100);
    expect(res.body.order.items[0].unitPrice).toBe(100);
  });

  test('ลบสินค้าทีหลัง ออเดอร์เก่ายังอยู่ครบ (productId เป็น null)', async () => {
    const p = await newProduct('brand-a', adminA, { price: 80, stock: 5 });
    const created = await placeOrder('brand-a', customerA1, [{ productId: p.id, quantity: 2 }]);

    const del = await as('brand-a', adminA)(api().delete(`/api/products/${p.id}`));
    expect(del.status).toBe(204);

    const res = await as('brand-a', customerA1)(api().get(`/api/orders/${created.body.order.id}`));
    expect(res.status).toBe(200);
    expect(res.body.order.items[0]).toMatchObject({ productId: null, name: p.name, quantity: 2, lineTotal: 160 });
  });
});

describe('การมองเห็นออเดอร์ (isolation)', () => {
  let orderA1, orderB, productA;

  beforeAll(async () => {
    productA = await newProduct('brand-a', adminA, { stock: 20 });
    const productB = await newProduct('brand-b', adminB, { stock: 20 });
    orderA1 = (await placeOrder('brand-a', customerA1, [{ productId: productA.id, quantity: 1 }])).body.order;
    orderB = (await placeOrder('brand-b', customerB, [{ productId: productB.id, quantity: 1 }])).body.order;
  });

  test('customer เห็นเฉพาะออเดอร์ของตัวเอง', async () => {
    const own = (await listOrders('brand-a', customerA1)).map((o) => o.id);
    const other = (await listOrders('brand-a', customerA2)).map((o) => o.id);
    expect(own).toContain(orderA1.id);
    expect(other).not.toContain(orderA1.id);
  });

  test('customer ดูออเดอร์ของคนอื่นในแบรนด์เดียวกัน -> 404', async () => {
    const res = await as('brand-a', customerA2)(api().get(`/api/orders/${orderA1.id}`));
    expect(res.status).toBe(404);
  });

  test('admin เห็นออเดอร์ของลูกค้าทุกคนในแบรนด์ตัวเอง', async () => {
    const ids = (await listOrders('brand-a', adminA)).map((o) => o.id);
    expect(ids).toContain(orderA1.id);
    expect(ids).not.toContain(orderB.id);

    const res = await as('brand-a', adminA)(api().get(`/api/orders/${orderA1.id}`));
    expect(res.status).toBe(200);
  });

  test('admin แบรนด์อื่นมองไม่เห็นออเดอร์ข้ามแบรนด์ -> 404 และไม่อยู่ในรายการ', async () => {
    const res = await as('brand-b', adminB)(api().get(`/api/orders/${orderA1.id}`));
    expect(res.status).toBe(404);
    const ids = (await listOrders('brand-b', adminB)).map((o) => o.id);
    expect(ids).not.toContain(orderA1.id);
    expect(ids).toContain(orderB.id);
  });

  test('id ไม่ใช่ UUID / ไม่มีอยู่จริง -> 404', async () => {
    expect((await as('brand-a', adminA)(api().get('/api/orders/abc'))).status).toBe(404);
    expect(
      (await as('brand-a', adminA)(api().get('/api/orders/00000000-0000-4000-8000-000000000000'))).status
    ).toBe(404);
  });

  test('แบ่งหน้า: limit=1 ได้ 1 รายการ', async () => {
    const res = await as('brand-a', adminA)(api().get('/api/orders?limit=1'));
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.limit).toBe(1);
  });
});

describe('PATCH /api/orders/:id/status (admin)', () => {
  const patch = (tenant, token, id, status) =>
    as(tenant, token)(api().patch(`/api/orders/${id}/status`)).send({ status });

  async function freshOrder(stock = 10, quantity = 2) {
    const p = await newProduct('brand-a', adminA, { stock });
    const res = await placeOrder('brand-a', customerA1, [{ productId: p.id, quantity }]);
    return { product: p, order: res.body.order };
  }

  test('pending -> paid -> shipped', async () => {
    const { order } = await freshOrder();
    const paid = await patch('brand-a', adminA, order.id, 'paid');
    expect(paid.status).toBe(200);
    expect(paid.body.order.status).toBe('paid');

    const shipped = await patch('brand-a', adminA, order.id, 'shipped');
    expect(shipped.status).toBe(200);
    expect(shipped.body.order.status).toBe('shipped');
  });

  test('เปลี่ยนข้ามขั้นไม่ได้ (pending -> shipped) -> 409', async () => {
    const { order } = await freshOrder();
    const res = await patch('brand-a', adminA, order.id, 'shipped');
    expect(res.status).toBe(409);
  });

  test('shipped แล้วเปลี่ยน/ยกเลิกไม่ได้ -> 409', async () => {
    const { order } = await freshOrder();
    await patch('brand-a', adminA, order.id, 'paid');
    await patch('brand-a', adminA, order.id, 'shipped');
    expect((await patch('brand-a', adminA, order.id, 'cancelled')).status).toBe(409);
  });

  test('ยกเลิก -> คืนสต็อก และยกเลิกซ้ำไม่คืนซ้ำ (409)', async () => {
    const { product, order } = await freshOrder(10, 3);
    expect(await stockOf('brand-a', product.id)).toBe(7);

    const res = await patch('brand-a', adminA, order.id, 'cancelled');
    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe('cancelled');
    expect(await stockOf('brand-a', product.id)).toBe(10);

    const again = await patch('brand-a', adminA, order.id, 'cancelled');
    expect(again.status).toBe(409);
    expect(await stockOf('brand-a', product.id)).toBe(10);
  });

  test('ยกเลิกออเดอร์ที่ชำระแล้ว -> คืนสต็อกเช่นกัน', async () => {
    const { product, order } = await freshOrder(10, 4);
    await patch('brand-a', adminA, order.id, 'paid');
    expect((await patch('brand-a', adminA, order.id, 'cancelled')).status).toBe(200);
    expect(await stockOf('brand-a', product.id)).toBe(10);
  });

  test('สถานะที่ไม่รู้จัก / ไม่ส่งมา -> 400', async () => {
    const { order } = await freshOrder();
    expect((await patch('brand-a', adminA, order.id, 'refunded')).status).toBe(400);
    expect((await patch('brand-a', adminA, order.id, undefined)).status).toBe(400);
  });

  test('admin แบรนด์อื่นเปลี่ยนสถานะออเดอร์ข้ามแบรนด์ไม่ได้ -> 404', async () => {
    const { order } = await freshOrder();
    const res = await patch('brand-b', adminB, order.id, 'paid');
    expect(res.status).toBe(404);
    const check = await as('brand-a', adminA)(api().get(`/api/orders/${order.id}`));
    expect(check.body.order.status).toBe('pending');
  });

  test('ออเดอร์ที่ไม่มีอยู่ / id ไม่ใช่ UUID -> 404', async () => {
    expect((await patch('brand-a', adminA, '00000000-0000-4000-8000-000000000000', 'paid')).status).toBe(404);
    expect((await patch('brand-a', adminA, 'abc', 'paid')).status).toBe(404);
  });
});
