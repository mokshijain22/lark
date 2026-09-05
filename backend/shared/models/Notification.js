const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgMember', required: true },
    type: {
      type: String,
      enum: ['approval_request', 'approval_actioned', 'task_assigned', 'event_invite', 'event_reminder'],
      required: true,
    },
    message: { type: String, required: true },
    relatedModule: { type: String, enum: ['approvals', 'calendar', 'tasks'], required: true },
    relatedId: { type: mongoose.Schema.Types.ObjectId, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);

// NOTE: This model only stores notifications for now.
// Delivery (socket emit / email / push) will be wired up in a later phase.
// A simple helper `createNotification()` can be added in shared/services once delivery is decided.
