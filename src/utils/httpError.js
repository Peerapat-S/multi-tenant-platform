// error ที่มี HTTP status ติดไปด้วย ให้ errorHandler แปลงเป็น response
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

module.exports = HttpError;