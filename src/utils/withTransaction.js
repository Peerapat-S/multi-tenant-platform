const pool = require('../config/db');

// รันฟังก์ชันภายใน transaction เดียว: สำเร็จ -> COMMIT, error -> ROLLBACK แล้วโยน error ต่อ
// fn ได้รับ client ตัวเดียวกันตลอด ต้องส่ง client นี้ให้ model ทุกครั้งที่ query ใน transaction
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ถ้า rollback ล้มเหลว ให้โยน error ตัวแรกที่เป็นต้นเหตุ */
    }
    throw err;
  } finally {
    client.release();
  }
}

module.exports = withTransaction;
