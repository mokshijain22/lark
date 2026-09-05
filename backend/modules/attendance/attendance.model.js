const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgMember', required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD" - one record per member per day
    checkIn: { type: Date, default: null },
    checkOut: { type: Date, default: null },
    status: { type: String, enum: ['present', 'absent', 'leave'], default: 'present' },
    relatedApproval: { type: mongoose.Schema.Types.ObjectId, ref: 'Approval', default: null }, // set when status becomes 'leave' via approval
  },
  { timestamps: true }
);

attendanceSchema.index({ member: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
