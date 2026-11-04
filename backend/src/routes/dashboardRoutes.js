const router = require('express').Router();
const ctrl = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.get('/stats', protect, ctrl.stats);

module.exports = router;
