const router = require('express').Router();
const controller = require('../controllers/tenantController');
const { authenticate, authorize } = require('../middlewares/auth');

// Public: list active brands
router.get('/', controller.list);

// Super Admin only: full CRUD (ไม่ต้องผ่าน tenantResolver เพราะ super_admin ทำงานระดับแพลตฟอร์ม)
router.get('/all', authenticate, authorize('super_admin'), controller.listAll);
router.get('/:id/users', authenticate, authorize('super_admin'), controller.listUsers);
router.post('/', authenticate, authorize('super_admin'), controller.create);
router.patch('/:id', authenticate, authorize('super_admin'), controller.update);
router.delete('/:id', authenticate, authorize('super_admin'), controller.remove);

module.exports = router;