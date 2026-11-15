// View: จัดรูป JSON ที่ส่งกลับ (ไม่ส่ง password_hash ออกไปเด็ดขาด)
function user(u) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.created_at,
  };
}

function authResult({ user: u, token }) {
  return { user: user(u), token };
}

module.exports = { user, authResult };