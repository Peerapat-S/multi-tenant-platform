const bcrypt = require('bcrypt');
const Tenant = require('../models/tenant');
const User = require('../models/user');
const HttpError = require('../utils/httpError');
const withTransaction = require('../utils/withTransaction');

const SALT_ROUNDS = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,48}[a-z0-9]$/;

function slugify(text) {
  return String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function listTenants() {
  return Tenant.listActive();
}

async function listAllTenants() {
  return Tenant.listAll();
}

async function createTenant(input = {}) {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name || name.length > 100) {
    throw new HttpError(400, 'Brand name is required (maximum 100 characters)');
  }

  const rawSlug = input.slug ? slugify(input.slug) : slugify(name);
  if (!rawSlug || rawSlug.length < 2 || rawSlug.length > 50 || !SLUG_RE.test(rawSlug)) {
    throw new HttpError(
      400,
      'Brand slug must be 2-50 lowercase alphanumeric characters and hyphens'
    );
  }

  const existing = await Tenant.findBySlug(rawSlug);
  if (existing) {
    throw new HttpError(409, `Brand slug "${rawSlug}" already exists`);
  }

  const description = typeof input.description === 'string' ? input.description.trim() : null;

  // Optional initial admin
  const adminEmail =
    typeof input.adminEmail === 'string' ? input.adminEmail.trim().toLowerCase() : '';
  const adminPassword = typeof input.adminPassword === 'string' ? input.adminPassword : '';
  const adminName =
    typeof input.adminName === 'string' && input.adminName.trim()
      ? input.adminName.trim()
      : `Admin ${name}`;

  if (adminEmail && !EMAIL_RE.test(adminEmail)) {
    throw new HttpError(400, 'Valid admin email is required');
  }
  if (adminEmail && (!adminPassword || adminPassword.length < 8)) {
    throw new HttpError(400, 'Admin password must be at least 8 characters');
  }

  return withTransaction(async (client) => {
    // 1. สร้างแบรนด์
    const tenant = await Tenant.create({ name, slug: rawSlug, description, isActive: true }, client);

    // 2. สร้างบัญชี admin ประจำแบรนด์ (ถ้ามีระบุ)
    let admin = null;
    if (adminEmail && adminPassword) {
      const passwordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);
      const user = await User.create(
        {
          tenantId: tenant.id,
          email: adminEmail,
          passwordHash,
          name: adminName,
          role: 'admin',
        },
        client
      );
      admin = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    }

    // 3. สร้างสำเนา super admin ประจำ tenant (สำหรับ dev/ทดสอบล็อกอินภายใต้แบรนด์นี้)
    const superHash = await bcrypt.hash('Admin1234', SALT_ROUNDS);
    await client.query(
      `INSERT INTO users (tenant_id, email, password_hash, name, role)
       VALUES ($1, 'superadmin@platform.com', $2, 'Super Admin', 'super_admin')
       ON CONFLICT (tenant_id, email) DO NOTHING`,
      [tenant.id, superHash]
    );

    return { tenant, admin };
  });
}

async function deleteTenant(id) {
  const { rows } = await require('../config/db').query(
    'SELECT id, slug, name FROM tenants WHERE id = $1',
    [id]
  );
  if (!rows[0]) throw new HttpError(404, 'Brand not found');

  const deleted = await Tenant.remove(id);
  if (!deleted) throw new HttpError(404, 'Brand not found');
  return rows[0];
}

async function updateTenant(id, input = {}) {
  const { rows } = await require('../config/db').query(
    'SELECT id FROM tenants WHERE id = $1',
    [id]
  );
  if (!rows[0]) throw new HttpError(404, 'Brand not found');

  const name = typeof input.name === 'string' ? input.name.trim() || null : null;
  const description = typeof input.description === 'string' ? input.description.trim() || null : null;
  const isActive = typeof input.isActive === 'boolean' ? input.isActive : null;

  const tenant = await Tenant.update(id, { name, description, isActive });
  return tenant;
}

module.exports = { listTenants, listAllTenants, createTenant, deleteTenant, updateTenant };
