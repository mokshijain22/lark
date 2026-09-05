const Share = require('./share.model');
const { notifyOne } = require('../../shared/services/notify.service');

const modelMap = {
  document: () => require('../docs/document.model'),
  spreadsheet: () => require('../sheets/spreadsheet.model'),
  presentation: () => require('../slides/presentation.model'),
  event: () => require('../calendar/event.model'),
  task: () => require('../tasks/task.model'),
  baseTable: () => require('../base/base.model'),
};

// POST /api/share  { itemType, itemId, sharedWith, permission }
const shareItem = async (req, res) => {
  try {
    const { itemType, itemId, sharedWith, permission } = req.body;
    if (!modelMap[itemType]) return res.status(400).json({ success: false, message: 'Invalid itemType' });

    const Model = modelMap[itemType]();
    const item = await Model.findById(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    const previewTitle = item.title || item.name || 'Untitled';

    const share = await Share.create({
      itemType, itemId, sharedBy: req.user._id, sharedWith, permission,
      previewTitle, previewLastEditedAt: item.updatedAt,
    });

    await notifyOne({
      recipient: sharedWith,
      type: 'task_assigned', // reused generic type for MVP
      message: `${req.user.name} shared "${previewTitle}" with you`,
      relatedModule: 'tasks',
      relatedId: share._id,
    });

    return res.status(201).json({ success: true, data: share });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/share/shared-with-me
const getSharedWithMe = async (req, res) => {
  try {
    const shares = await Share.find({ sharedWith: req.user._id }).populate('sharedBy', 'name avatar').sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: shares });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/share/:id/permission
const updatePermission = async (req, res) => {
  try {
    const share = await Share.findById(req.params.id);
    if (!share) return res.status(404).json({ success: false, message: 'Share not found' });
    if (!share.sharedBy.equals(req.user._id)) return res.status(403).json({ success: false, message: 'Not authorized' });
    share.permission = req.body.permission;
    await share.save();
    return res.status(200).json({ success: true, data: share });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { shareItem, getSharedWithMe, updatePermission };
