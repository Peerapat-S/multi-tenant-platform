const BASE = '/api';

// เรียก backend: ใส่ X-Tenant-ID และ Authorization ให้ถ้ามีค่า
// noTenant = true สำหรับ super_admin routes ที่ไม่ต้องการ X-Tenant-ID
export async function request(path, { method = 'GET', body, tenant, token, noTenant = false } = {}) {
  const headers = {};
  if (tenant && !noTenant) headers['X-Tenant-ID'] = tenant;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const money = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' });
export const formatPrice = (n) => money.format(n);
