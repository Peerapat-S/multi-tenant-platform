const router = require('express').Router();
const controller = require('../controllers/orderController');
const { authenticate, authorize } = require('../middlewares/auth');

// ทุก endpoint ของคำสั่งซื้อต้อง login
router.use(authenticate);

router.post('/', authorize('customer'), controller.create);       // ลูกค้าสั่งซื้อ
router.get('/', controller.list);                                  // ลูกค้า: ของตัวเอง / admin: ทั้งแบรนด์
router.get('/:id', controller.get);
router.patch('/:id/status', authorize('admin'), controller.updateStatus);

module.exports = router;
