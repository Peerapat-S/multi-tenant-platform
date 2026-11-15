const { api, pool, register, login, cleanup, uniqueEmail } = require('./helpers');

beforeAll(cleanup);
afterAll(async () => {
  await cleanup();
  await pool.end();
});

describe('POST /api/auth/register', () => {
  test('ไม่มี tenant header -> 400', async () => {
    const res = await api().post('/api/auth/register').send({});
    expect(res.status).toBe(400);
  });

  test('สมัครสำเร็จ -> 201 ได้ token และไม่เปิดเผย password_hash', async () => {
    const res = await register('brand-a', { email: uniqueEmail(), password: '12345678', name: 'Test' });

    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ role: 'customer', name: 'Test' });
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });

  test('ส่ง role: admin มา ก็ยังได้ customer', async () => {
    const res = await register('brand-a', {
      email: uniqueEmail(), password: '12345678', name: 'Sneaky', role: 'admin',
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('customer');
  });

  test('อีเมลซ้ำในแบรนด์เดียวกัน -> 409', async () => {
    const body = { email: uniqueEmail(), password: '12345678', name: 'Dup' };
    expect((await register('brand-a', body)).status).toBe(201);
    expect((await register('brand-a', body)).status).toBe(409);
  });

  test('อีเมลเดียวกันสมัครในคนละแบรนด์ได้', async () => {
    const body = { email: uniqueEmail(), password: '12345678', name: 'Both' };
    expect((await register('brand-a', body)).status).toBe(201);
    expect((await register('brand-b', body)).status).toBe(201);
  });

  test.each([
    ['รหัสผ่านสั้น', { email: 'x@test.com', password: '123', name: 'X' }],
    ['อีเมลผิดรูปแบบ', { email: 'nope', password: '12345678', name: 'X' }],
    ['ไม่มีชื่อ', { email: 'x@test.com', password: '12345678' }],
  ])('ข้อมูลไม่ถูกต้อง (%s) -> 400', async (_label, body) => {
    const res = await register('brand-a', body);
    expect(res.status).toBe(400);
  });

  test('JSON เสีย -> 400', async () => {
    const res = await api()
      .post('/api/auth/register')
      .set('X-Tenant-ID', 'brand-a')
      .set('Content-Type', 'application/json')
      .send('{"email": ');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  const email = uniqueEmail();

  beforeAll(async () => {
    await register('brand-a', { email, password: '12345678', name: 'Login User' });
  });

  test('login สำเร็จ -> 200 ได้ token', async () => {
    const res = await api().post('/api/auth/login').set('X-Tenant-ID', 'brand-a')
      .send({ email, password: '12345678' });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  test('รหัสผ่านผิด -> 401', async () => {
    const res = await api().post('/api/auth/login').set('X-Tenant-ID', 'brand-a')
      .send({ email, password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  test('ผู้ใช้ของ brand-a login ที่ brand-b ไม่ได้ -> 401', async () => {
    const res = await api().post('/api/auth/login').set('X-Tenant-ID', 'brand-b')
      .send({ email, password: '12345678' });
    expect(res.status).toBe(401);
  });

  test('ไม่ส่งรหัสผ่าน -> 400', async () => {
    const res = await api().post('/api/auth/login').set('X-Tenant-ID', 'brand-a').send({ email });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  const email = uniqueEmail();
  let token;

  beforeAll(async () => {
    await register('brand-a', { email, password: '12345678', name: 'Me User' });
    token = await login('brand-a', email, '12345678');
  });

  test('ไม่มี token -> 401', async () => {
    const res = await api().get('/api/auth/me').set('X-Tenant-ID', 'brand-a');
    expect(res.status).toBe(401);
  });

  test('token ถูกต้อง -> 200', async () => {
    const res = await api().get('/api/auth/me').set('X-Tenant-ID', 'brand-a')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
  });

  test('เอา token brand-a ไปใช้กับ brand-b -> 403', async () => {
    const res = await api().get('/api/auth/me').set('X-Tenant-ID', 'brand-b')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});