// รวมค่า config จาก environment (server.js เรียก dotenv ก่อนโหลดไฟล์นี้)
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error('JWT_SECRET is not set in environment');
}

module.exports = {
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
};