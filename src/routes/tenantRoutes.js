const router = require('express').Router();
const controller = require('../controllers/tenantController');

router.get('/', controller.list);

module.exports = router;