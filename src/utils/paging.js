// อ่าน ?page=&limit= : page เริ่มที่ 1, limit ค่าเริ่มต้น 20 สูงสุด 100
// ค่าที่ผิดปกติจะถูกปรับให้อยู่ในช่วงที่ใช้ได้ (ไม่โยน error)
function parsePaging({ page, limit } = {}) {
  const l = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const p = Math.max(parseInt(page, 10) || 1, 1);
  return { page: p, limit: l, offset: (p - 1) * l };
}

module.exports = parsePaging;
