-- 007_tenant_description.sql : Add description field to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing dev tenants with sample descriptions
UPDATE tenants SET description = 'แบรนด์สินค้าไลฟ์สไตล์ระดับพรีเมียม เน้นคุณภาพและความทันสมัย เหมาะสำหรับผู้ที่ต้องการความโดดเด่นในทุกด้านของชีวิต' WHERE slug = 'brand-a';
UPDATE tenants SET description = 'ร้านค้าออนไลน์สำหรับคนรักแฟชั่น รวบรวมสินค้าเทรนด์ล่าสุดจากทั่วโลก ด้วยราคาที่เข้าถึงได้ง่าย' WHERE slug = 'brand-b';
