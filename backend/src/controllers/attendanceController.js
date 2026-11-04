const Attendance = require('../models/Attendance');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { getPagination, buildMeta } = require('../utils/pagination');
const attendanceService = require('../services/attendanceService');
const { scopeFilter, canAccessEmployee } = require('../services/accessService');

const populateOpts = [
  { path: 'employeeId', select: 'name email managerId' },
  { path: 'validatedBy', select: 'name' },
];

const buildFilter = (q) => {
  const f = {};
  if (q.from || q.to) {
    f.date = {};
    if (q.from) f.date.$gte = q.from;
    if (q.to) f.date.$lte = q.to;
  }
  if (q.validationStatus) f.validationStatus = q.validationStatus;
  if (q.workingHoursStatus) f.workingHoursStatus = q.workingHoursStatus;
  if (q.punchedOut === 'true') f.punchOut = { $ne: null };
  if (q.punchedOut === 'false') f.punchOut = null;
  if (q.employeeId) f.employeeId = q.employeeId;
  return f;
};

const paginatedList = async (req, res, scope) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { $and: [scope, buildFilter(req.query)] };
  const [rows, total] = await Promise.all([
    Attendance.find(filter).populate(populateOpts).sort({ date: -1, punchIn: -1 }).skip(skip).limit(limit),
    Attendance.countDocuments(filter),
  ]);
  sendSuccess(res, rows, 'Attendance fetched', 200, buildMeta(page, limit, total));
};

exports.punchIn = asyncHandler(async (req, res) => {
  const record = await attendanceService.punchIn(req.user, req.body);
  sendSuccess(res, record, 'Punched in successfully', 201);
});

exports.punchOut = asyncHandler(async (req, res) => {
  const record = await attendanceService.punchOut(req.user, req.body);
  sendSuccess(res, record, 'Punched out successfully');
});

exports.getToday = asyncHandler(async (req, res) => {
  sendSuccess(res, await attendanceService.getToday(req.user._id));
});

exports.getMy = asyncHandler((req, res) => paginatedList(req, res, { employeeId: req.user._id }));

// Managers: assigned team only (scopeFilter). Admins hitting /team see everyone.
exports.getTeam = asyncHandler(async (req, res) => paginatedList(req, res, await scopeFilter(req.user)));

exports.getAll = asyncHandler((req, res) => paginatedList(req, res, {}));

exports.getById = asyncHandler(async (req, res) => {
  const record = await Attendance.findById(req.params.id).populate(populateOpts);
  if (!record) throw new ApiError(404, 'Attendance record not found');
  if (!(await canAccessEmployee(req.user, record.employeeId))) throw new ApiError(403, 'Access denied');
  sendSuccess(res, record);
});

exports.validate = asyncHandler(async (req, res) => {
  const record = await Attendance.findById(req.params.id);
  if (!record) throw new ApiError(404, 'Attendance record not found');
  if (!(await canAccessEmployee(req.user, record.employeeId))) throw new ApiError(403, 'Access denied');
  if (String(record.employeeId) === String(req.user._id)) throw new ApiError(403, 'You cannot validate your own attendance');
  if (!record.punchOut) throw new ApiError(409, 'Attendance can only be validated after punch-out');

  record.validationStatus = req.body.validationStatus;
  record.validationRemarks = req.body.remarks;
  record.validatedBy = req.user._id;
  record.validatedAt = new Date();
  await record.save();
  await record.populate(populateOpts);
  sendSuccess(res, record, `Attendance marked ${record.validationStatus}`);
});
