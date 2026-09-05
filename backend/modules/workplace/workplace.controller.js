const Workplace = require('./workplace.model');

// GET /api/workplace  (public to all logged-in members - shown at login)
const getWorkplace = async (req, res) => {
  try {
    let page = await Workplace.findOne();
    if (!page) page = await Workplace.create({ blocks: [] });
    return res.status(200).json({ success: true, data: page });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/workplace  (Admin/Owner only - full blocks replace)
const updateWorkplace = async (req, res) => {
  try {
    let page = await Workplace.findOne();
    if (!page) page = new Workplace();
    page.blocks = req.body.blocks;
    page.updatedBy = req.user._id;
    await page.save();
    return res.status(200).json({ success: true, data: page });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getWorkplace, updateWorkplace };
