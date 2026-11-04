const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema.Types;

const overtimeSchema = new mongoose.Schema(
  {
    employeeId: { type: ObjectId, ref: 'User', required: true },
    attendanceId: { type: ObjectId, ref: 'Attendance', required: true },
    requestedHours: { type: Number, required: true, min: 0.25, max: 12 },
    reason: { type: String, required: true, trim: true, maxlength: 500 },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    reviewedBy: { type: ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    remarks: { type: String, default: '' },
  },
  { timestamps: true }
);

overtimeSchema.index({ employeeId: 1, createdAt: -1 });
overtimeSchema.index({ status: 1, createdAt: -1 });
// Only one active (Pending/Approved) request per attendance record
overtimeSchema.index(
  { attendanceId: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['Pending', 'Approved'] } } }
);

module.exports = mongoose.model('OvertimeRequest', overtimeSchema);
