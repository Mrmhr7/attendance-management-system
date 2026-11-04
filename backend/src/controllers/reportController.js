const Attendance = require('../models/Attendance');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { getPagination, buildMeta } = require('../utils/pagination');
const { dateString } = require('../utils/dates');
const { scopeFilter } = require('../services/accessService');

// Daily report. Employee: own records, Manager: team, Admin: everyone.
exports.daily = asyncHandler(async (req, res) => {
  const date = req.query.date || dateString();
  const { page, limit, skip } = getPagination(req.query);
  const filter = { $and: [await scopeFilter(req.user), { date }] };

  const [rows, total, completed, incomplete, inProgress] = await Promise.all([
    Attendance.find(filter)
      .populate('employeeId', 'name email')
      .populate('validatedBy', 'name')
      .sort({ punchIn: 1 })
      .skip(skip)
      .limit(limit),
    Attendance.countDocuments(filter),
    Attendance.countDocuments({ $and: [filter, { workingHoursStatus: 'Completed' }] }),
    Attendance.countDocuments({ $and: [filter, { workingHoursStatus: 'Incomplete' }] }),
    Attendance.countDocuments({ $and: [filter, { workingHoursStatus: 'In Progress' }] }),
  ]);

  sendSuccess(res, rows, 'Daily report generated', 200, {
    ...buildMeta(page, limit, total),
    date,
    summary: { total, completed, incomplete, inProgress },
  });
});
