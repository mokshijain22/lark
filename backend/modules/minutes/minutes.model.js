const mongoose = require('mongoose');

const minutesSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' }, // rich text HTML, same editing model as Docs
    linkedEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgMember', required: true },
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'OrgMember' }], // auto-filled from event attendees on create
  },
  { timestamps: true }
);

module.exports = mongoose.model('Minutes', minutesSchema);
