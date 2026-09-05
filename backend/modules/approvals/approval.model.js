const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgMember', required: true },
    type: { type: String, required: true, trim: true }, // e.g. "Leave Request", "Expense Claim"
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    attachment: { type: String, default: null }, // Cloudinary URL

    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },

    // Optional - only used when type is a leave-style request; drives Attendance module sync
    leaveStartDate: { type: String, default: null }, // "YYYY-MM-DD"
    leaveEndDate: { type: String, default: null },

    approver: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgMember', default: null }, // specific approver, optional
    actionedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgMember', default: null },
    actionedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Approval', approvalSchema);
