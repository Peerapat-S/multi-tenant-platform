const router = require('express').Router();
const controller = require('../controllers/productController');
const { authenticate, authorize } = require('../middlewares/auth');

// ดูสินค้า: เปิดสาธารณะ (หน้าร้านค้า) แต่ยังต้องระบุแบรนด์ด้วย X-Tenant-ID
router.get('/', controller.list);
router.get('/:id', controller.get);

// เขียน/แก้/ลบ: ต้อง login และเป็น admin
router.post('/', authenticate, authorize('admin'), controller.create);
router.put('/:id', authenticate, authorize('admin'), controller.update);
router.delete('/:id', authenticate, authorize('admin'), controller.remove);

module.exports = router;