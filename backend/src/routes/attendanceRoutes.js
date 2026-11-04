const router = require('express').Router();
const ctrl = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParam } = require('../validators/common');
const v = require('../validators/attendanceValidator');

router.use(protect);

router.post('/punch-in', authorize('employee'), validate(v.punch), ctrl.punchIn);
router.post('/punch-out', authorize('employee'), validate(v.punch), ctrl.punchOut);
router.get('/today', authorize('employee'), ctrl.getToday);
router.get('/my', authorize('employee'), validate(v.list, 'query'), ctrl.getMy);
router.get('/team', authorize('manager', 'admin'), validate(v.list, 'query'), ctrl.getTeam);
router.get('/all', authorize('admin'), validate(v.list, 'query'), ctrl.getAll);
router.get('/:id', validate(idParam, 'params'), ctrl.getById);
router.patch('/:id/validate', authorize('manager', 'admin'), validate(idParam, 'params'), validate(v.validate), ctrl.validate);

module.exports = router;
