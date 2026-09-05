const Event = require('./event.model');
const { notifyMany } = require('../../shared/services/notify.service');

// Expands a recurring event into individual occurrences within [rangeStart, rangeEnd]
const expandOccurrences = (event, rangeStart, rangeEnd) => {
  const occurrences = [];
  const { type, endDate } = event.recurrence || { type: 'none' };

  if (!type || type === 'none') {
    if (event.date >= rangeStart && event.date <= rangeEnd) {
      occurrences.push({ ...event.toObject(), occurrenceDate: event.date });
    }
    return occurrences;
  }

  const stepDays = { daily: 1, weekly: 7, monthly: 30 }[type] || 1; // monthly approximated; fine for MVP list view
  const limit = endDate ? new Date(Math.min(endDate, rangeEnd)) : rangeEnd;

  let cursor = new Date(event.date);
  while (cursor <= limit) {
    if (cursor >= rangeStart && cursor <= limit) {
      occurrences.push({ ...event.toObject(), occurrenceDate: new Date(cursor) });
    }
    if (type === 'monthly') {
      cursor.setMonth(cursor.getMonth() + 1);
    } else {
      cursor.setDate(cursor.getDate() + stepDays);
    }
  }
  return occurrences;
};

// @route POST /api/calendar/events
const createEvent = async (req, res) => {
  try {
    const { title, description, date, startTime, endTime, attendees, recurrence, reminderMinutesBefore, linkedChannel, meetingRoom } = req.body;

    if (!title || !date || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'title, date, startTime and endTime are required' });
    }

    const event = await Event.create({
      title,
      description,
      date,
      startTime,
      endTime,
      createdBy: req.user._id,
      attendees: (attendees || []).map((m) => ({ member: m, rsvp: 'Pending' })),
      recurrence: recurrence || { type: 'none' },
      reminderMinutesBefore,
      linkedChannel,
      meetingRoom,
    });

    if (attendees && attendees.length) {
      await notifyMany(attendees, {
        type: 'event_invite',
        message: `${req.user.name} invited you to "${title}"`,
        relatedModule: 'calendar',
        relatedId: event._id,
      });
    }

    return res.status(201).json({ success: true, data: event });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/calendar/events?from=YYYY-MM-DD&to=YYYY-MM-DD  (month/week view)
const getEvents = async (req, res) => {
  try {
    const { from, to } = req.query;
    const rangeStart = from ? new Date(from) : new Date(new Date().setDate(1));
    const rangeEnd = to ? new Date(to) : new Date(new Date().setMonth(new Date().getMonth() + 1));

    // Fetch events that could possibly occur in range:
    // non-recurring within range, OR recurring starting before rangeEnd (and not ended before rangeStart)
    const events = await Event.find({
      $or: [
        { 'recurrence.type': 'none', date: { $gte: rangeStart, $lte: rangeEnd } },
        {
          'recurrence.type': { $ne: 'none' },
          date: { $lte: rangeEnd },
          $or: [{ 'recurrence.endDate': null }, { 'recurrence.endDate': { $gte: rangeStart } }],
        },
      ],
    })
      .populate('createdBy', 'name avatar')
      .populate('attendees.member', 'name avatar');

    const allOccurrences = events.flatMap((ev) => expandOccurrences(ev, rangeStart, rangeEnd));
    allOccurrences.sort((a, b) => new Date(a.occurrenceDate) - new Date(b.occurrenceDate));

    return res.status(200).json({ success: true, data: allOccurrences });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/calendar/events/:id
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name avatar')
      .populate('attendees.member', 'name avatar');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    return res.status(200).json({ success: true, data: event });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/calendar/events/:id/rsvp  { rsvp: 'Accepted' | 'Declined' }
const respondRsvp = async (req, res) => {
  try {
    const { rsvp } = req.body;
    if (!['Accepted', 'Declined'].includes(rsvp)) {
      return res.status(400).json({ success: false, message: 'rsvp must be Accepted or Declined' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const attendee = event.attendees.find((a) => a.member.equals(req.user._id));
    if (!attendee) {
      return res.status(403).json({ success: false, message: 'You are not invited to this event' });
    }
    attendee.rsvp = rsvp;
    await event.save();

    return res.status(200).json({ success: true, data: event });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @route DELETE /api/calendar/events/:id (creator or Admin/Owner)
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const isPrivileged = ['Owner', 'Admin'].includes(req.user.role);
    if (!event.createdBy.equals(req.user._id) && !isPrivileged) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this event' });
    }

    await event.deleteOne();
    return res.status(200).json({ success: true, message: 'Event deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createEvent, getEvents, getEventById, respondRsvp, deleteEvent };
