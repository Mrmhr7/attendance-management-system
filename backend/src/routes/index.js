const router = require('express').Router();

router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/attendance', require('./attendanceRoutes'));
router.use('/overtime', require('./overtimeRoutes'));
router.use('/reports', require('./reportRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));

module.exports = router;
