-- 006_super_admin.sql : Add super_admin role and seed dev super admin
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- อัปเดต check constraint ของ role ให้รองรับ super_admin
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('super_admin', 'admin', 'customer'));

-- สร้าง super admin เริ่มต้นสำหรับทุก tenant ที่มีอยู่ (รหัสผ่าน: Admin1234)
INSERT INTO users (tenant_id, email, password_hash, name, role)
SELECT id, 'superadmin@platform.com', crypt('Admin1234', gen_salt('bf', 10)), 'Super Admin', 'super_admin'
  FROM tenants
ON CONFLICT (tenant_id, email) DO NOTHING;
