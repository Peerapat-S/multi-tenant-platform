// ค่าที่ใช้ตอนรันเทสต์ (ไม่โหลด .env)
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

// API test รันบนเครื่อง host จึงต่อ Postgres ผ่านพอร์ตที่ publish ไว้ (localhost:5432)
// ถ้าจะใช้ DB อื่นให้ตั้ง TEST_DATABASE_URL
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/platform';