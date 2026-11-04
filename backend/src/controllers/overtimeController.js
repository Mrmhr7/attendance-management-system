const Attendance = require('../models/Attendance');
const OvertimeRequest = require('../models/OvertimeRequest');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { getPagination, buildMeta } = require('../utils/pagination');
const { scopeFilter, canAccessEmployee } = require('../services/accessService');

const populateOpts = [
  { path: 'employeeId', select: 'name email' },
  { path: 'attendanceId', select: 'date totalWorkingHours punchIn punchOut' },
  { path: 'reviewedBy', select: 'name' },
];

const list = async (req, res, filter) => {
  const { page, limit, skip } = getPagination(req.query);
  const [rows, total] = await Promise.all([
    OvertimeRequest.find(filter).populate(populateOpts).sort({ createdAt: -1 }).skip(skip).limit(limit),
    OvertimeRequest.countDocuments(filter),
  ]);
  sendSuccess(res, rows, 'Overtime requests fetched', 200, buildMeta(page, limit, total));
};

exports.create = asyncHandler(async (req, res) => {
  const { attendanceId, requestedHours, reason } = req.body;
  const attendance = await Attendance.findOne({ _id: attendanceId, employeeId: req.user._id }); // ownership check
  if (!attendance) throw new ApiError(404, 'Attendance record not found');
  if (!attendance.punchOut) throw new ApiError(409, 'Overtime can only be requested after punching out');

  if (await OvertimeRequest.exists({ attendanceId, status: { $in: ['Pending', 'Approved'] } })) {
    throw new ApiError(409, 'An overtime request already exists for this attendance record');
  }

  const request = await OvertimeRequest.create({ employeeId: req.user._id, attendanceId, requestedHours, reason });
  attendance.overtimeStatus = 'Pending';
  attendance.approvedOvertimeHours = 0;
  await attendance.save();
  sendSuccess(res, request, 'Overtime request submitted', 201);
});

exports.getMy = asyncHandler((req, res) => list(req, res, { employeeId: req.user._id }));

// Manager: pending requests of their team only. Admin: all. ?status=Approved|Rejected|All also supported.
exports.getPending = asyncHandler(async (req, res) => {
  const status = req.query.status || 'Pending';
  const filter = { ...(await scopeFilter(req.user)) };
  if (status !== 'All') filter.status = status;
  return list(req, res, filter);
});

exports.review = asyncHandler(async (req, res) => {
  const request = await OvertimeRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, 'Overtime request not found');
  if (String(request.employeeId) === String(req.user._id)) {
    throw new ApiError(403, 'You cannot review your own overtime request');
  }
  if (!(await canAccessEmployee(req.user, request.employeeId))) throw new ApiError(403, 'Access denied');
  if (request.status !== 'Pending') throw new ApiError(409, `This request was already ${request.status.toLowerCase()}`);

  request.status = req.body.status;
  request.remarks = req.body.remarks;
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();
  await request.save();

  // Reflect the decision on the attendance record
  await Attendance.updateOne(
    { _id: request.attendanceId },
    {
      $set: {
        overtimeStatus: request.status,
        approvedOvertimeHours: request.status === 'Approved' ? request.requestedHours : 0,
      },
    }
  );

  await request.populate(populateOpts);
  sendSuccess(res, request, `Overtime request ${request.status.toLowerCase()}`);
});
