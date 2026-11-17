const Tenant = require('../models/tenant');
const tenantService = require('../services/tenantService');

async function list(req, res, next) {
  try {
    res.json({ items: await Tenant.listActive() });
  } catch (err) {
    next(err);
  }
}

// Super Admin: list all tenants with stats
async function listAll(req, res, next) {
  try {
    res.json({ items: await tenantService.listAllTenants() });
  } catch (err) {
    next(err);
  }
}

// Super Admin: create brand
async function create(req, res, next) {
  try {
    const result = await tenantService.createTenant(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

// Super Admin: delete brand
async function remove(req, res, next) {
  try {
    const deleted = await tenantService.deleteTenant(req.params.id);
    res.json({ deleted });
  } catch (err) {
    next(err);
  }
}

// Super Admin: update brand
async function update(req, res, next) {
  try {
    const tenant = await tenantService.updateTenant(req.params.id, req.body);
    res.json({ tenant });
  } catch (err) {
    next(err);
  }
}

// Super Admin: list users of a specific brand
async function listUsers(req, res, next) {
  try {
    const pool = require('../config/db');
    const { rows } = await pool.query(
      `SELECT id, name, email, role, created_at AS "createdAt"
         FROM users
        WHERE tenant_id = $1
        ORDER BY CASE role WHEN 'super_admin' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END, created_at DESC`,
      [req.params.id]
    );
    res.json({ items: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, listAll, create, remove, update, listUsers };