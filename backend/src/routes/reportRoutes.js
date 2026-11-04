const router = require('express').Router();
const ctrl = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v = require('../validators/attendanceValidator');

router.get('/daily', protect, validate(v.report, 'query'), ctrl.daily);

module.exports = router;
