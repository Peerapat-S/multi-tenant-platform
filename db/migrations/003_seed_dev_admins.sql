-- admin สำหรับ dev ของแต่ละแบรนด์ (รหัสผ่าน: Admin1234)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO users (tenant_id, email, password_hash, name, role)
SELECT id, 'admin@' || slug || '.com', crypt('Admin1234', gen_salt('bf', 10)), 'Admin ' || name, 'admin'
  FROM tenants
 WHERE slug IN ('brand-a', 'brand-b')
ON CONFLICT (tenant_id, email) DO NOTHING;