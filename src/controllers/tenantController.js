const Tenant = require('../models/tenant');

async function list(req, res, next) {
  try {
    res.json({ items: await Tenant.listActive() });
  } catch (err) {
    next(err);
  }
}

module.exports = { list };