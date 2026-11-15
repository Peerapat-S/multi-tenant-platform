const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

jest.mock('../../src/models/user');
const User = require('../../src/models/user');
const authService = require('../../src/services/authService');

const tenant = { id: 'tenant-1', slug: 'brand-a', name: 'Brand A' };
const dbUser = (over = {}) => ({
  id: 'user-1',
  tenant_id: 'tenant-1',
  email: 'a@test.com',
  name: 'Test',
  role: 'customer',
  created_at: new Date(),
  ...over,
});

describe('authService.register', () => {
  const input = { email: 'a@test.com', password: '12345678', name: 'Test' };

  beforeEach(() => {
    User.create.mockImplementation(async (data) =>
      dbUser({ email: data.email, name: data.name })
    );
  });

  test('สมัครสำเร็จ ได้ user และ token ที่มี tenant_id/role', async () => {
    const { user, token } = await authService.register(tenant, input);

    expect(user.email).toBe('a@test.com');
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    expect(payload.sub).toBe('user-1');
    expect(payload.tenant_id).toBe('tenant-1');
    expect(payload.role).toBe('customer');
  });

  test('เก็บรหัสผ่านเป็น bcrypt hash ไม่ใช่ข้อความเดิม', async () => {
    await authService.register(tenant, input);

    const arg = User.create.mock.calls[0][0];
    expect(arg.tenantId).toBe('tenant-1');
    expect(arg.passwordHash).not.toBe('12345678');
    expect(await bcrypt.compare('12345678', arg.passwordHash)).toBe(true);
  });

  test('แปลงอีเมลเป็นตัวพิมพ์เล็กและตัดช่องว่าง', async () => {
    await authService.register(tenant, { ...input, email: '  A@Test.COM ' });
    expect(User.create.mock.calls[0][0].email).toBe('a@test.com');
  });

  test('ไม่รับ role จาก client (กันสมัครเป็น admin เอง)', async () => {
    await authService.register(tenant, { ...input, role: 'admin' });
    expect(User.create.mock.calls[0][0]).not.toHaveProperty('role');
  });

  test.each([
    ['อีเมลผิดรูปแบบ', { ...input, email: 'not-an-email' }],
    ['ไม่มีอีเมล', { ...input, email: undefined }],
    ['รหัสผ่านสั้นกว่า 8 ตัว', { ...input, password: '123' }],
    ['ไม่มีรหัสผ่าน', { ...input, password: undefined }],
    ['ไม่มีชื่อ', { ...input, name: '   ' }],
  ])('ข้อมูลไม่ถูกต้อง (%s) -> 400', async (_label, body) => {
    await expect(authService.register(tenant, body)).rejects.toMatchObject({ status: 400 });
    expect(User.create).not.toHaveBeenCalled();
  });

  test('อีเมลซ้ำในแบรนด์เดียวกัน (pg 23505) -> 409', async () => {
    User.create.mockRejectedValue({ code: '23505' });
    await expect(authService.register(tenant, input)).rejects.toMatchObject({ status: 409 });
  });

  test('error อื่นจาก DB ถูกโยนต่อ ไม่ถูกแปลงเป็น 409', async () => {
    const dbErr = new Error('connection lost');
    User.create.mockRejectedValue(dbErr);
    await expect(authService.register(tenant, input)).rejects.toBe(dbErr);
  });
});

describe('authService.login', () => {
  let hash;
  beforeAll(async () => {
    hash = await bcrypt.hash('12345678', 4);
  });

  test('login สำเร็จ ได้ token', async () => {
    User.findByEmail.mockResolvedValue(dbUser({ password_hash: hash }));

    const { user, token } = await authService.login(tenant, {
      email: 'a@test.com',
      password: '12345678',
    });

    expect(user.id).toBe('user-1');
    expect(jwt.verify(token, process.env.JWT_SECRET).tenant_id).toBe('tenant-1');
  });

  test('ค้นหาผู้ใช้ด้วย tenant id และอีเมลที่ normalize แล้ว', async () => {
    User.findByEmail.mockResolvedValue(dbUser({ password_hash: hash }));

    await authService.login(tenant, { email: ' A@Test.com ', password: '12345678' });

    expect(User.findByEmail).toHaveBeenCalledWith('tenant-1', 'a@test.com');
  });

  test('รหัสผ่านผิด -> 401', async () => {
    User.findByEmail.mockResolvedValue(dbUser({ password_hash: hash }));
    await expect(
      authService.login(tenant, { email: 'a@test.com', password: 'wrong-password' })
    ).rejects.toMatchObject({ status: 401, message: 'Invalid email or password' });
  });

  test('ไม่พบอีเมล -> 401 ข้อความเดียวกับรหัสผิด', async () => {
    User.findByEmail.mockResolvedValue(null);
    await expect(
      authService.login(tenant, { email: 'nobody@test.com', password: '12345678' })
    ).rejects.toMatchObject({ status: 401, message: 'Invalid email or password' });
  });

  test.each([
    [{ email: 'a@test.com' }],
    [{ password: '12345678' }],
    [undefined],
  ])('ข้อมูลไม่ครบ (%j) -> 400', async (body) => {
    await expect(authService.login(tenant, body)).rejects.toMatchObject({ status: 400 });
  });
});