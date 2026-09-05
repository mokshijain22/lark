const mongoose = require('mongoose');

const attendeeSchema = new mongoose.Schema(
  {
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgMember', required: true },
    rsvp: { type: String, enum: ['Pending', 'Accepted', 'Declined'], default: 'Pending' },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    date: { type: Date, required: true }, // start date of the (first) event
    startTime: { type: String, required: true }, // "10:00"
    endTime: { type: String, required: true }, // "10:30"

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgMember', required: true },
    attendees: { type: [attendeeSchema], default: [] },

    recurrence: {
      type: { type: String, enum: ['none', 'daily', 'weekly', 'monthly'], default: 'none' },
      endDate: { type: Date, default: null }, // recurrence stops after this date
    },

    reminderMinutesBefore: { type: Number, default: 10 },
    linkedChannel: { type: String, default: null }, // stub for future chat-link
    meetingRoom: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);
