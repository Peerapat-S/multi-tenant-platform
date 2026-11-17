const jwt = require('jsonwebtoken');
const HttpError = require('../utils/httpError');
const { jwtSecret } = require('../config/env');

// ต้องใช้หลัง tenantResolver (ต้องมี req.tenant แล้ว)
function authenticate(req, res, next) {
  const [scheme, token] = (req.header('Authorization') || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Missing or invalid Authorization header'));
  }

  let payload;
  try {
    payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
  } catch (err) {
    return next(new HttpError(401, 'Invalid or expired token'));
  }

  // กัน token ของแบรนด์ A ไปใช้กับแบรนด์ B
  // super_admin มีสิทธิ์ระดับแพลตฟอร์ม เข้าถึงได้ทุกแบรนด์หรือเส้นทางระดับระบบที่ไม่มี req.tenant
  if (payload.role !== 'super_admin' && req.tenant && payload.tenant_id !== req.tenant.id) {
    return next(new HttpError(403, 'Token does not belong to this tenant'));
  }

  req.user = { id: payload.sub, tenantId: payload.tenant_id, role: payload.role };
  next();
}

// ใช้ต่อจาก authenticate เช่น authorize('admin') หรือ authorize('super_admin')
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new HttpError(403, 'Forbidden'));
    }
    // ตรงกับ role ที่ระบุ
    if (roles.includes(req.user.role)) {
      return next();
    }
    // super_admin สามารถทำหน้าที่แทน admin ได้
    if (req.user.role === 'super_admin' && roles.includes('admin')) {
      return next();
    }
    return next(new HttpError(403, 'Forbidden'));
  };
}

module.exports = { authenticate, authorize };