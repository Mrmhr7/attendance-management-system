const mongoose = require('mongoose');
const config = require('../config/env');

const { ObjectId } = mongoose.Schema.Types;

const locationSchema = new mongoose.Schema(
  {
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    accuracy: { type: Number },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: { type: ObjectId, ref: 'User', required: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // business day, YYYY-MM-DD
    punchIn: { type: Date, required: true },
    punchOut: { type: Date, default: null },
    punchInSelfie: { type: String, required: true },
    punchOutSelfie: { type: String, default: null },
    punchInLocation: { type: locationSchema, required: true },
    punchOutLocation: { type: locationSchema, default: null },
    totalWorkingHours: { type: Number, default: 0 },
    workingHoursStatus: { type: String, enum: ['In Progress', 'Completed', 'Incomplete'], default: 'In Progress' },
    validationStatus: { type: String, enum: ['Pending', 'Valid', 'Invalid'], default: 'Pending' },
    validationRemarks: { type: String, default: '' },
    validatedBy: { type: ObjectId, ref: 'User', default: null },
    validatedAt: { type: Date, default: null },
    overtimeStatus: { type: String, enum: ['None', 'Pending', 'Approved', 'Rejected'], default: 'None' },
    approvedOvertimeHours: { type: Number, default: 0 },
    autoClosed: { type: Boolean, default: false }, // missed punch-out
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true }); // one record per employee per day
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ validationStatus: 1 });
attendanceSchema.index({ employeeId: 1, punchOut: 1 });

// Hours worked so far (live for open records, stored value once punched out)
attendanceSchema.virtual('liveWorkingHours').get(function liveHours() {
  if (this.punchOut) return this.totalWorkingHours;
  if (this.autoClosed || !this.punchIn) return 0;
  return Math.round(((Date.now() - this.punchIn.getTime()) / 3600000) * 100) / 100;
});

attendanceSchema.virtual('remainingHours').get(function remaining() {
  return Math.max(0, Math.round((config.shiftHours - this.liveWorkingHours) * 100) / 100);
});

module.exports = mongoose.model('Attendance', attendanceSchema);
