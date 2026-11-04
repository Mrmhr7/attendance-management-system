const Attendance = require('../models/Attendance');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');
const { dateString, hoursBetween } = require('../utils/dates');
const imageService = require('./imageService');

const staleCutoff = () => new Date(Date.now() - config.maxOpenHours * 3600000);

// Open records older than the cutoff are missed punch-outs: close them as Incomplete (0 h)
const closeStaleRecords = (employeeId) =>
  Attendance.updateMany(
    { employeeId, punchOut: null, autoClosed: { $ne: true }, punchIn: { $lt: staleCutoff() } },
    { $set: { autoClosed: true, workingHoursStatus: 'Incomplete' } }
  );

const findActive = (employeeId) =>
  Attendance.findOne({ employeeId, punchOut: null, autoClosed: { $ne: true } }).sort({ punchIn: -1 });

exports.getToday = async (employeeId) => {
  await closeStaleRecords(employeeId);
  return (await findActive(employeeId)) || Attendance.findOne({ employeeId, date: dateString() });
};

exports.punchIn = async (user, { selfie, location }) => {
  await closeStaleRecords(user._id);

  if (await findActive(user._id)) throw new ApiError(409, 'You are already punched in. Punch out first.');

  const now = new Date(); // server-generated timestamp
  const date = dateString(now);
  if (await Attendance.exists({ employeeId: user._id, date })) {
    throw new ApiError(409, 'Attendance for today has already been recorded');
  }

  const selfieUrl = await imageService.saveSelfie(selfie, user._id, 'in');
  try {
    return await Attendance.create({
      employeeId: user._id,
      date,
      punchIn: now,
      punchInSelfie: selfieUrl,
      punchInLocation: location,
    });
  } catch (err) {
    if (err.code === 11000) throw new ApiError(409, 'Attendance for today has already been recorded');
    throw err;
  }
};

exports.punchOut = async (user, { selfie, location }) => {
  await closeStaleRecords(user._id);

  const active = await findActive(user._id);
  if (!active) throw new ApiError(409, 'No active punch-in found. Punch in first.');

  const selfieUrl = await imageService.saveSelfie(selfie, user._id, 'out');
  const now = new Date();
  const hours = hoursBetween(active.punchIn, now);

  // The punchOut:null condition makes a double submit safe (only one request wins)
  const result = await Attendance.updateOne(
    { _id: active._id, punchOut: null },
    {
      $set: {
        punchOut: now,
        punchOutSelfie: selfieUrl,
        punchOutLocation: location,
        totalWorkingHours: hours,
        workingHoursStatus: hours >= config.shiftHours ? 'Completed' : 'Incomplete',
      },
    }
  );
  if (result.matchedCount === 0) throw new ApiError(409, 'You have already punched out');

  return Attendance.findById(active._id);
};
