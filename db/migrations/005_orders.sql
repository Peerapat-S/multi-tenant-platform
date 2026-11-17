-- 005_orders.sql : คำสั่งซื้อ (orders) และรายการสินค้าในคำสั่งซื้อ (order_items)
-- ทั้งสองตารางมี tenant_id เหมือนตารางอื่น เพื่อให้ทุก query กรองตามแบรนด์ได้

CREATE TABLE orders (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id    UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status     VARCHAR(20)   NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending', 'paid', 'shipped', 'cancelled')),
  total      NUMERIC(12,2) NOT NULL CHECK (total >= 0),
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_id     UUID          NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  -- ลบสินค้าได้โดยไม่กระทบประวัติคำสั่งซื้อ (เก็บชื่อและราคา ณ ตอนสั่งไว้ในแถวนี้เอง)
  product_id   UUID          REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(150)  NOT NULL,
  unit_price   NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  quantity     INTEGER       NOT NULL CHECK (quantity > 0),
  line_no      INTEGER       NOT NULL DEFAULT 0
);

CREATE INDEX idx_orders_tenant_user ON orders(tenant_id, user_id, created_at DESC);
CREATE INDEX idx_order_items_order  ON order_items(order_id);
