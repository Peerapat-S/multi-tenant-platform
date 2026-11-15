jest.mock('../../src/config/db', () => ({ query: jest.fn() }));
const pool = require('../../src/config/db');
const tenantResolver = require('../../src/middlewares/tenant');

function mockReq(headerValue) {
  return { header: jest.fn().mockReturnValue(headerValue) };
}
function mockRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() };
}

describe('tenantResolver', () => {
  test('ไม่มี header X-Tenant-ID -> 400', async () => {
    const res = mockRes();
    const next = jest.fn();

    await tenantResolver(mockReq(undefined), res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(pool.query).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test('ไม่พบแบรนด์ -> 404', async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = mockRes();
    const next = jest.fn();

    await tenantResolver(mockReq('xxx'), res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });

  test('พบแบรนด์ -> ใส่ req.tenant และเรียก next()', async () => {
    const tenant = { id: 't1', slug: 'brand-a', name: 'Brand A' };
    pool.query.mockResolvedValue({ rows: [tenant] });
    const req = mockReq('brand-a');
    const next = jest.fn();

    await tenantResolver(req, mockRes(), next);

    expect(req.tenant).toEqual(tenant);
    expect(next).toHaveBeenCalledWith();
  });

  test('แปลง slug เป็นตัวพิมพ์เล็กและตัดช่องว่างก่อน query', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 't1' }] });

    await tenantResolver(mockReq('  Brand-A '), mockRes(), jest.fn());

    expect(pool.query.mock.calls[0][1]).toEqual(['brand-a']);
  });

  test('DB error -> ส่งต่อให้ next(err)', async () => {
    const err = new Error('db down');
    pool.query.mockRejectedValue(err);
    const next = jest.fn();

    await tenantResolver(mockReq('brand-a'), mockRes(), next);

    expect(next).toHaveBeenCalledWith(err);
  });
});