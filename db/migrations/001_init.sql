-- 001_init.sql : tenants, users, products
-- รูปแบบ: shared database + shared schema (แยกข้อมูลแต่ละแบรนด์ด้วย tenant_id)

CREATE TABLE tenants (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       VARCHAR(50)  NOT NULL UNIQUE,   -- ค่าที่ส่งใน header X-Tenant-ID เช่น 'nike'
  name       VARCHAR(100) NOT NULL,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'customer'
                CHECK (role IN ('admin', 'customer')),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  -- อีเมลเดียวกันสมัครได้ในคนละแบรนด์ แต่ซ้ำกันในแบรนด์เดียวกันไม่ได้
  UNIQUE (tenant_id, email)
);

CREATE TABLE products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        VARCHAR(150)  NOT NULL,
  description TEXT,
  price       NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  stock       INTEGER       NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ทุก query กรองด้วย tenant_id จึงควรมี index
CREATE INDEX idx_products_tenant_id ON products(tenant_id);