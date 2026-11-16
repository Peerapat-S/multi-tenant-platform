const { api, pool, register, login, cleanup, unique, uniqueEmail } = require('./helpers');

const ADMIN_PASSWORD = 'Admin1234';
let adminA, adminB, customerA; // token
let product; // สินค้าที่ admin brand-a สร้าง

const as = (tenant, token) => (req) =>
  req.set('X-Tenant-ID', tenant).set('Authorization', `Bearer ${token}`);

beforeAll(async () => {
  await cleanup();
  adminA = await login('brand-a', 'admin@brand-a.com', ADMIN_PASSWORD);
  adminB = await login('brand-b', 'admin@brand-b.com', ADMIN_PASSWORD);

  const email = uniqueEmail();
  await register('brand-a', { email, password: '12345678', name: 'Customer' });
  customerA = await login('brand-a', email, '12345678');

  const res = await as('brand-a', adminA)(api().post('/api/products'))
    .send({ name: unique('shirt'), price: 299, stock: 10 });
  product = res.body.product;
});

afterAll(async () => {
  await cleanup();
  await pool.end();
});

describe('การเข้าถึงโดยไม่ login (หน้าร้านค้า)', () => {
  test('ดูรายการสินค้าได้โดยไม่ต้อง login', async () => {
    const res = await api().get('/api/products').set('X-Tenant-ID', 'brand-a');
    expect(res.status).toBe(200);
    expect(res.body.items.map((p) => p.id)).toContain(product.id);
  });

  test('ดูสินค้าตัวเดียวได้โดยไม่ต้อง login', async () => {
    const res = await api().get(`/api/products/${product.id}`).set('X-Tenant-ID', 'brand-a');
    expect(res.status).toBe(200);
  });

  test('ยังต้องระบุแบรนด์ (ไม่มี X-Tenant-ID -> 400)', async () => {
    const res = await api().get('/api/products');
    expect(res.status).toBe(400);
  });

  test('แบรนด์อื่นไม่เห็นสินค้าแม้ไม่ login', async () => {
    const res = await api().get('/api/products').set('X-Tenant-ID', 'brand-b');
    expect(res.status).toBe(200);
    expect(res.body.items.map((p) => p.id)).not.toContain(product.id);
  });

  test('สร้าง/แก้/ลบโดยไม่มี token -> 401', async () => {
    const t = (r) => r.set('X-Tenant-ID', 'brand-a');
    expect((await t(api().post('/api/products')).send({ name: 'x', price: 1 })).status).toBe(401);
    expect((await t(api().put(`/api/products/${product.id}`)).send({ price: 1 })).status).toBe(401);
    expect((await t(api().delete(`/api/products/${product.id}`))).status).toBe(401);
  });
});

describe('สิทธิ์ของ customer', () => {
  test('ดูรายการได้', async () => {
    const res = await as('brand-a', customerA)(api().get('/api/products'));
    expect(res.status).toBe(200);
    expect(res.body.items.map((p) => p.id)).toContain(product.id);
  });

  test('ดูสินค้าตัวเดียวได้', async () => {
    const res = await as('brand-a', customerA)(api().get(`/api/products/${product.id}`));
    expect(res.status).toBe(200);
  });

  test('สร้าง/แก้/ลบไม่ได้ -> 403', async () => {
    const body = { name: unique('nope'), price: 1 };
    expect((await as('brand-a', customerA)(api().post('/api/products')).send(body)).status).toBe(403);
    expect((await as('brand-a', customerA)(api().put(`/api/products/${product.id}`)).send({ price: 1 })).status).toBe(403);
    expect((await as('brand-a', customerA)(api().delete(`/api/products/${product.id}`))).status).toBe(403);
  });
});

describe('admin: สร้างและตรวจสอบข้อมูล', () => {
  test('สร้างสำเร็จ -> 201 และ price เป็นตัวเลข', async () => {
    expect(product).toMatchObject({ price: 299, stock: 10 });
  });

  test.each([
    ['ราคาติดลบ', { name: 'x', price: -5 }],
    ['ไม่มีชื่อ', { price: 5 }],
    ['stock ทศนิยม', { name: 'x', price: 5, stock: 1.5 }],
  ])('ข้อมูลไม่ถูกต้อง (%s) -> 400', async (_label, body) => {
    const res = await as('brand-a', adminA)(api().post('/api/products')).send(body);
    expect(res.status).toBe(400);
  });

  test('id ที่ไม่ใช่ UUID -> 404 (ไม่ใช่ 500)', async () => {
    const res = await as('brand-a', adminA)(api().get('/api/products/not-a-uuid'));
    expect(res.status).toBe(404);
  });

  test('แบ่งหน้าด้วย limit', async () => {
    const res = await as('brand-a', adminA)(api().get('/api/products?limit=1&page=1'));
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeLessThanOrEqual(1);
    expect(res.body.limit).toBe(1);
  });
});

describe('การแยกข้อมูลระหว่างแบรนด์ (multi-tenant isolation)', () => {
  test('admin brand-b ไม่เห็นสินค้าของ brand-a ในรายการ', async () => {
    const res = await as('brand-b', adminB)(api().get('/api/products'));
    expect(res.status).toBe(200);
    expect(res.body.items.map((p) => p.id)).not.toContain(product.id);
  });

  test('admin brand-b ดูสินค้าของ brand-a ด้วย id -> 404', async () => {
    const res = await as('brand-b', adminB)(api().get(`/api/products/${product.id}`));
    expect(res.status).toBe(404);
  });

  test('admin brand-b แก้สินค้าของ brand-a -> 404 และข้อมูลไม่เปลี่ยน', async () => {
    const res = await as('brand-b', adminB)(api().put(`/api/products/${product.id}`)).send({ price: 1 });
    expect(res.status).toBe(404);

    const check = await as('brand-a', adminA)(api().get(`/api/products/${product.id}`));
    expect(check.body.product.price).toBe(299);
  });

  test('admin brand-b ลบสินค้าของ brand-a -> 404 และสินค้ายังอยู่', async () => {
    const res = await as('brand-b', adminB)(api().delete(`/api/products/${product.id}`));
    expect(res.status).toBe(404);

    const check = await as('brand-a', adminA)(api().get(`/api/products/${product.id}`));
    expect(check.status).toBe(200);
  });

  test('token brand-a ใช้กับ header brand-b (เขียนสินค้า) -> 403', async () => {
    const res = await as('brand-b', adminA)(api().post('/api/products')).send({ name: unique('x'), price: 1 });
    expect(res.status).toBe(403);
  });
});

describe('admin: แก้และลบ', () => {
  test('แก้เฉพาะราคา ชื่อและ stock คงเดิม', async () => {
    const res = await as('brand-a', adminA)(api().put(`/api/products/${product.id}`)).send({ price: 349 });
    expect(res.status).toBe(200);
    expect(res.body.product).toMatchObject({ name: product.name, price: 349, stock: 10 });
  });

  test('ไม่ส่ง field ใดเลย -> 400', async () => {
    const res = await as('brand-a', adminA)(api().put(`/api/products/${product.id}`)).send({});
    expect(res.status).toBe(400);
  });

  test('ลบสำเร็จ -> 204 แล้วดูอีกครั้ง -> 404', async () => {
    const del = await as('brand-a', adminA)(api().delete(`/api/products/${product.id}`));
    expect(del.status).toBe(204);

    const after = await as('brand-a', adminA)(api().get(`/api/products/${product.id}`));
    expect(after.status).toBe(404);
  });
});