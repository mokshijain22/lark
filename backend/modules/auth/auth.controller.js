const jwt = require('jsonwebtoken');
const OrgMember = require('../../shared/models/OrgMember');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @route POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const existing = await OrgMember.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // First registered user becomes Owner automatically; rest default to Member
    const memberCount = await OrgMember.countDocuments();
    const assignedRole = memberCount === 0 ? 'Owner' : (role === 'Admin' ? 'Admin' : 'Member');

    const member = await OrgMember.create({ name, email, password, role: assignedRole });

    return res.status(201).json({
      success: true,
      data: {
        _id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        avatar: member.avatar,
        token: generateToken(member._id),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @route POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const member = await OrgMember.findOne({ email: email.toLowerCase() }).select('+password');
    if (!member || !(await member.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    member.status = 'online';
    member.lastSeen = new Date();
    await member.save();

    return res.status(200).json({
      success: true,
      data: {
        _id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        avatar: member.avatar,
        token: generateToken(member._id),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/auth/me
const getMe = async (req, res) => {
  return res.status(200).json({ success: true, data: req.user });
};

module.exports = { register, login, getMe };
