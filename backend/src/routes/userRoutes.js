const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParam } = require('../validators/common');
const v = require('../validators/userValidator');

router.use(protect);
router.get('/', authorize('admin', 'manager'), validate(v.listUsers, 'query'), ctrl.list);
router.get('/:id', validate(idParam, 'params'), ctrl.getById);
router.post('/', authorize('admin'), validate(v.createUser), ctrl.create);
router.put('/:id', authorize('admin'), validate(idParam, 'params'), validate(v.updateUser), ctrl.update);
router.patch('/:id/status', authorize('admin'), validate(idParam, 'params'), validate(v.updateStatus), ctrl.updateStatus);
router.patch('/:id/assign-manager', authorize('admin'), validate(idParam, 'params'), validate(v.assignManager), ctrl.assignManager);
router.delete('/:id', authorize('admin'), validate(idParam, 'params'), ctrl.remove);

module.exports = router;