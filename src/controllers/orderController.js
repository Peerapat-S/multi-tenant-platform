const orderService = require('../services/orderService');
const view = require('../views/orderView');

async function create(req, res, next) {
  try {
    const order = await orderService.create(req.tenant, req.user, req.body);
    res.status(201).json({ order: view.order(order) });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    res.json(view.list(await orderService.list(req.tenant, req.user, req.query)));
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    const order = await orderService.get(req.tenant, req.user, req.params.id);
    res.json({ order: view.order(order) });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const order = await orderService.updateStatus(req.tenant, req.params.id, req.body?.status);
    res.json({ order: view.order(order) });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, get, updateStatus };
