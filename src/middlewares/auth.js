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
  if (payload.tenant_id !== req.tenant.id) {
    return next(new HttpError(403, 'Token does not belong to this tenant'));
  }

  req.user = { id: payload.sub, tenantId: payload.tenant_id, role: payload.role };
  next();
}

// ใช้ต่อจาก authenticate เช่น authorize('admin')
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new HttpError(403, 'Forbidden'));
    }
    next();
  };
}

module.exports = { authenticate, authorize };