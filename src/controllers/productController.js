const productService = require('../services/productService');
const view = require('../views/productView');

async function list(req, res, next) {
  try {
    res.json(view.list(await productService.list(req.tenant, req.query)));
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    res.json({ product: view.product(await productService.get(req.tenant, req.params.id)) });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const product = await productService.create(req.tenant, req.body);
    res.status(201).json({ product: view.product(product) });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const product = await productService.update(req.tenant, req.params.id, req.body);
    res.json({ product: view.product(product) });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await productService.remove(req.tenant, req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, get, create, update, remove };