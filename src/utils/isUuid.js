const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// กัน query ด้วย id ที่ไม่ใช่ UUID (ไม่งั้น Postgres จะ throw error 500)
module.exports = (value) => typeof value === 'string' && UUID_RE.test(value);