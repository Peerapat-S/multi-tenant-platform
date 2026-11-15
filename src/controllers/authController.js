const authService = require('../services/authService');
const User = require('../models/user');
const HttpError = require('../utils/httpError');
const view = require('../views/userView');

async function register(req, res, next) {
  try {
    const result = await authService.register(req.tenant, req.body);
    res.status(201).json(view.authResult(result));
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.tenant, req.body);
    res.json(view.authResult(result));
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await User.findById(req.tenant.id, req.user.id);
    if (!user) throw new HttpError(404, 'User not found');
    res.json({ user: view.user(user) });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };