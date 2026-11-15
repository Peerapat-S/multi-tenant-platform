const jwt = require('jsonwebtoken');
const { authenticate, authorize } = require('../../src/middlewares/auth');

const SECRET = process.env.JWT_SECRET;

function makeToken(payload = {}, options = {}, secret = SECRET) {
  return jwt.sign({ tenant_id: 't1', role: 'admin', ...payload }, secret, {
    subject: 'u1',
    expiresIn: '1h',
    ...options,
  });
}
function reqWith(authHeader, tenantId = 't1') {
  return { header: jest.fn().mockReturnValue(authHeader), tenant: { id: tenantId } };
}

describe('authenticate', () => {
  test('ไม่มี Authorization header -> 401', () => {
    const next = jest.fn();
    authenticate(reqWith(undefined), {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  test('scheme ไม่ใช่ Bearer -> 401', () => {
    const next = jest.fn();
    authenticate(reqWith(`Basic ${makeToken()}`), {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  test('token มั่ว -> 401', () => {
    const next = jest.fn();
    authenticate(reqWith('Bearer not.a.token'), {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  test('token หมดอายุ -> 401', () => {
    const next = jest.fn();
    authenticate(reqWith(`Bearer ${makeToken({}, { expiresIn: -10 })}`), {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  test('token เซ็นด้วยคีย์อื่น -> 401', () => {
    const next = jest.fn();
    authenticate(reqWith(`Bearer ${makeToken({}, {}, 'other-secret')}`), {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 401 }));
  });

  test('token ของอีกแบรนด์ (tenant_id ไม่ตรง) -> 403', () => {
    const next = jest.fn();
    authenticate(reqWith(`Bearer ${makeToken({ tenant_id: 'other' })}`, 't1'), {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
  });

  test('token ถูกต้อง -> ใส่ req.user และเรียก next()', () => {
    const req = reqWith(`Bearer ${makeToken()}`);
    const next = jest.fn();

    authenticate(req, {}, next);

    expect(req.user).toEqual({ id: 'u1', tenantId: 't1', role: 'admin' });
    expect(next).toHaveBeenCalledWith();
  });
});

describe('authorize', () => {
  test('role ที่อนุญาต -> ผ่าน', () => {
    const next = jest.fn();
    authorize('admin')({ user: { role: 'admin' } }, {}, next);
    expect(next).toHaveBeenCalledWith();
  });

  test('role ที่ไม่อนุญาต -> 403', () => {
    const next = jest.fn();
    authorize('admin')({ user: { role: 'customer' } }, {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
  });

  test('ไม่มี req.user -> 403', () => {
    const next = jest.fn();
    authorize('admin')({}, {}, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 403 }));
  });
});