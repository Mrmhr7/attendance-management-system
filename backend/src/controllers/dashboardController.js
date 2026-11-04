const User = require('../models/User');
const Attendance = require('../models/Attendance');
const OvertimeRequest = require('../models/OvertimeRequest');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { dateString } = require('../utils/dates');
const { teamEmployeeIds } = require('../services/accessService');

const employeeStats = async (user, today) => {
  const monthStart = `${today.slice(0, 8)}01`;
  const mine = { employeeId: user._id, date: { $gte: monthStart, $lte: today } };
  const [present, completed, incomplete, pendingOvertime] = await Promise.all([
    Attendance.countDocuments(mine),
    Attendance.countDocuments({ ...mine, workingHoursStatus: 'Completed' }),
    Attendance.countDocuments({ ...mine, workingHoursStatus: 'Incomplete' }),
    OvertimeRequest.countDocuments({ employeeId: user._id, status: 'Pending' }),
  ]);
  return { month: { present, completed, incomplete }, pendingOvertime };
};

const managerStats = async (user, today) => {
  const ids = await teamEmployeeIds(user);
  const team = { employeeId: { $in: ids } };
  const [presentToday, incompleteAttendance, pendingOvertime, verificationQueue] = await Promise.all([
    Attendance.countDocuments({ ...team, date: today }),
    Attendance.countDocuments({ ...team, workingHoursStatus: 'Incomplete' }),
    OvertimeRequest.countDocuments({ ...team, status: 'Pending' }),
    Attendance.countDocuments({ ...team, validationStatus: 'Pending', punchOut: { $ne: null } }),
  ]);
  return { teamMembers: ids.length, presentToday, incompleteAttendance, pendingOvertime, verificationQueue };
};

const adminStats = async (today) => {
  const [totalEmployees, totalManagers, totalAttendance, presentToday, incompleteAttendance, pendingOvertime, invalidRecords] =
    await Promise.all([
      User.countDocuments({ role: 'employee', isActive: true }),
      User.countDocuments({ role: 'manager', isActive: true }),
      Attendance.countDocuments(),
      Attendance.countDocuments({ date: today }),
      Attendance.countDocuments({ workingHoursStatus: 'Incomplete' }),
      OvertimeRequest.countDocuments({ status: 'Pending' }),
      Attendance.countDocuments({ validationStatus: 'Invalid' }),
    ]);
  return { totalEmployees, totalManagers, totalAttendance, presentToday, incompleteAttendance, pendingOvertime, invalidRecords };
};

exports.stats = asyncHandler(async (req, res) => {
  const today = dateString();
  let data;
  if (req.user.role === 'admin') data = await adminStats(today);
  else if (req.user.role === 'manager') data = await managerStats(req.user, today);
  else data = await employeeStats(req.user, today);
  sendSuccess(res, data);
});
