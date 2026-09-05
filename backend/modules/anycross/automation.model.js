const mongoose = require('mongoose');

const automationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgMember', required: true },
    trigger: {
      module: { type: String, enum: ['approvals', 'base', 'schedule'], required: true }, // "new Approval request", "Base row added", "time-based"
      // for schedule: cron-like simple time "HH:MM" + frequency
      time: { type: String, default: null },
      frequency: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
    },
    action: {
      type: { type: String, enum: ['add_base_row', 'send_channel_message'], required: true },
      targetTableId: { type: mongoose.Schema.Types.ObjectId, ref: 'BaseTable', default: null }, // for add_base_row
      message: { type: String, default: null }, // for send_channel_message (stub - logged as notification for now)
    },
    isActive: { type: Boolean, default: true },
    lastRunAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Automation', automationSchema);
