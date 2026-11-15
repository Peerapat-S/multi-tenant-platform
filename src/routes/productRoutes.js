const router = require('express').Router();
const controller = require('../controllers/productController');
const { authenticate, authorize } = require('../middlewares/auth');

// ต้อง login ทุก route; ดูได้ทุก role, เขียน/แก้/ลบเฉพาะ admin
router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', authorize('admin'), controller.create);
router.put('/:id', authorize('admin'), controller.update);
router.delete('/:id', authorize('admin'), controller.remove);

module.exports = router;