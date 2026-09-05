const Attendance = require('./attendance.model');

const todayStr = () => new Date().toISOString().slice(0, 10);

// POST /api/attendance/checkin
const checkIn = async (req, res) => {
  try {
    const date = todayStr();
    const record = await Attendance.findOneAndUpdate(
      { member: req.user._id, date },
      { member: req.user._id, date, checkIn: new Date(), status: 'present' },
      { upsert: true, new: true }
    );
    return res.status(200).json({ success: true, data: record });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/attendance/checkout
const checkOut = async (req, res) => {
  try {
    const date = todayStr();
    const record = await Attendance.findOneAndUpdate(
      { member: req.user._id, date },
      { checkOut: new Date() },
      { new: true }
    );
    if (!record) return res.status(400).json({ success: false, message: 'You have not checked in today' });
    return res.status(200).json({ success: true, data: record });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/attendance/history?member=id&from=&to=
const getHistory = async (req, res) => {
  try {
    const member = req.query.member || req.user._id;
    const filter = { member };
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = req.query.from;
      if (req.query.to) filter.date.$lte = req.query.to;
    }
    const history = await Attendance.find(filter).sort({ date: -1 });
    return res.status(200).json({ success: true, data: history });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/attendance/leave-balance  - simple annual allotment minus leave days taken this year
const ANNUAL_LEAVE_DAYS = 18;
const getLeaveBalance = async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const taken = await Attendance.countDocuments({
      member: req.user._id,
      status: 'leave',
      date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` },
    });
    return res.status(200).json({ success: true, data: { allotted: ANNUAL_LEAVE_DAYS, taken, remaining: ANNUAL_LEAVE_DAYS - taken } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { checkIn, checkOut, getHistory, getLeaveBalance };
