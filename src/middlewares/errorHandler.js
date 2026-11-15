// ต้องมี 4 พารามิเตอร์ Express ถึงจะรู้ว่าเป็น error handler
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || 500;

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    error: status >= 500 ? 'Internal server error' : err.message,
  });
}

module.exports = errorHandler;