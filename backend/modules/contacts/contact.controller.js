const OrgMember = require('../../shared/models/OrgMember');

// @route GET /api/contacts
// Lists all org members, optional ?search=name query
const getContacts = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = search ? { name: { $regex: search, $options: 'i' } } : {};

    const contacts = await OrgMember.find(filter).sort({ name: 1 });
    return res.status(200).json({ success: true, data: contacts });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/contacts/:id
const getContactById = async (req, res) => {
  try {
    const contact = await OrgMember.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }
    return res.status(200).json({ success: true, data: contact });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/contacts/:id/role  (Admin/Owner only)
const changeRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['Owner', 'Admin', 'Member'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const contact = await OrgMember.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    contact.role = role;
    await contact.save();

    return res.status(200).json({ success: true, data: contact });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/contacts/me/avatar
const updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const member = await OrgMember.findByIdAndUpdate(
      req.user._id,
      { avatar: req.file.path },
      { new: true }
    );
    return res.status(200).json({ success: true, data: member });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getContacts, getContactById, changeRole, updateAvatar };
