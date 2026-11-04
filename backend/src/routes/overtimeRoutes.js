const router = require('express').Router();
const ctrl = require('../controllers/overtimeController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParam } = require('../validators/common');
const v = require('../validators/overtimeValidator');

router.use(protect);

router.post('/', authorize('employee'), validate(v.create), ctrl.create);
router.get('/my', authorize('employee'), validate(v.list, 'query'), ctrl.getMy);
router.get('/pending', authorize('manager', 'admin'), validate(v.list, 'query'), ctrl.getPending);
router.patch('/:id/review', authorize('manager', 'admin'), validate(idParam, 'params'), validate(v.review), ctrl.review);

module.exports = router;
