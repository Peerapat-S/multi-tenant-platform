const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const HttpError = require('../utils/httpError');
const { jwtSecret, jwtExpiresIn } = require('../config/env');

const SALT_ROUNDS = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user) {
  // sub = user id, และเก็บ tenant_id ไว้ใน token เพื่อกัน token ข้ามแบรนด์
  return jwt.sign({ tenant_id: user.tenant_id, role: user.role }, jwtSecret, {
    subject: user.id,
    expiresIn: jwtExpiresIn,
    algorithm: 'HS256',
  });
}

function validateRegister({ email, password, name }) {
  if (!email || !EMAIL_RE.test(email)) {
    throw new HttpError(400, 'Valid email is required');
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new HttpError(400, 'Password must be at least 8 characters');
  }
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new HttpError(400, 'Name is required');
  }
}

async function register(tenant, input = {}) {
  validateRegister(input);

  const email = input.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  let user;
  try {
    // role ถูกกำหนดเป็น customer เสมอ ไม่รับจาก client (กันสมัครเป็น admin เอง)
    user = await User.create({
      tenantId: tenant.id,
      email,
      passwordHash,
      name: input.name.trim(),
    });
  } catch (err) {
    if (err.code === '23505') {
      throw new HttpError(409, 'Email already registered');
    }
    throw err;
  }

  return { user, token: signToken(user) };
}

async function login(tenant, { email, password } = {}) {
  if (!email || !password) {
    throw new HttpError(400, 'Email and password are required');
  }

  const user = await User.findByEmail(tenant.id, String(email).trim().toLowerCase());
  const ok = user && (await bcrypt.compare(password, user.password_hash));

  // ข้อความเดียวกันทั้งกรณีไม่พบอีเมลและรหัสผิด (ไม่บอกใบ้ผู้โจมตี)
  if (!ok) {
    throw new HttpError(401, 'Invalid email or password');
  }

  return { user, token: signToken(user) };
}

module.exports = { register, login, signToken };