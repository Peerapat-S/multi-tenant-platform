const { api, pool } = require('./helpers');

afterAll(() => pool.end());

describe('Tenant resolution', () => {
  test('GET /health ไม่ต้องใช้ tenant', async () => {
    const res = await api().get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  test('ไม่ส่ง X-Tenant-ID -> 400', async () => {
    const res = await api().get('/api/whoami');
    expect(res.status).toBe(400);
  });

  test('แบรนด์ที่ไม่มีอยู่ -> 404', async () => {
    const res = await api().get('/api/whoami').set('X-Tenant-ID', 'no-such-brand');
    expect(res.status).toBe(404);
  });

  test('brand-a -> ได้ข้อมูลแบรนด์', async () => {
    const res = await api().get('/api/whoami').set('X-Tenant-ID', 'brand-a');
    expect(res.status).toBe(200);
    expect(res.body.tenant).toMatchObject({ slug: 'brand-a', name: 'Brand A' });
  });

  test('slug ไม่สนตัวพิมพ์ใหญ่เล็ก', async () => {
    const res = await api().get('/api/whoami').set('X-Tenant-ID', 'BRAND-B');
    expect(res.status).toBe(200);
    expect(res.body.tenant.slug).toBe('brand-b');
  });
});