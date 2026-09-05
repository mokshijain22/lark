const Approval = require('./approval.model');
const ApprovalTemplate = require('./approvalTemplate.model');
const { notifyOne, notifyMany } = require('../../shared/services/notify.service');
const OrgMember = require('../../shared/models/OrgMember');

// @route POST /api/approvals
const submitRequest = async (req, res) => {
  try {
    const { type, title, description, approver, leaveStartDate, leaveEndDate } = req.body;
    if (!type || !title) {
      return res.status(400).json({ success: false, message: 'type and title are required' });
    }

    const approval = await Approval.create({
      requester: req.user._id,
      type,
      title,
      description,
      approver: approver || null,
      attachment: req.file ? req.file.path : null,
      leaveStartDate: leaveStartDate || null,
      leaveEndDate: leaveEndDate || null,
    });

    // Notify approver(s): specific approver if given, else all Admin/Owner
    let recipients = [];
    if (approver) {
      recipients = [approver];
    } else {
      const admins = await OrgMember.find({ role: { $in: ['Owner', 'Admin'] } }).select('_id');
      recipients = admins.map((a) => a._id);
    }

    await notifyMany(recipients, {
      type: 'approval_request',
      message: `${req.user.name} submitted a new ${type} request: "${title}"`,
      relatedModule: 'approvals',
      relatedId: approval._id,
    });

    // Fire any Anycross automations watching for new approval requests
    try {
      const Automation = require('../anycross/automation.model');
      const rules = await Automation.find({ 'trigger.module': 'approvals', isActive: true });
      for (const rule of rules) {
        rule.lastRunAt = new Date();
        await rule.save();
        // MVP: log the automation firing as a notification to its creator.
        await notifyOne({
          recipient: rule.createdBy,
          type: 'approval_actioned',
          message: `Automation "${rule.name}" fired: new ${type} request submitted`,
          relatedModule: 'approvals',
          relatedId: approval._id,
        });
      }
    } catch (automationErr) {
      console.error('Anycross approvals-trigger error:', automationErr.message);
    }

    return res.status(201).json({ success: true, data: approval });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/approvals/mine  -> requester's own requests
const getMyRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { requester: req.user._id };
    if (status) filter.status = status;

    const requests = await Approval.find(filter)
      .populate('requester', 'name avatar')
      .populate('approver', 'name avatar')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: requests });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/approvals/pending -> requests this user can act on (Admin/Owner, or specific approver)
const getPendingForApprover = async (req, res) => {
  try {
    const isPrivileged = ['Owner', 'Admin'].includes(req.user.role);

    const filter = isPrivileged
      ? { status: 'Pending', $or: [{ approver: null }, { approver: req.user._id }] }
      : { status: 'Pending', approver: req.user._id };

    const requests = await Approval.find(filter)
      .populate('requester', 'name avatar')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: requests });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/approvals/:id/action  { decision: 'Approved' | 'Rejected' }
const actionRequest = async (req, res) => {
  try {
    const { decision } = req.body;
    if (!['Approved', 'Rejected'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'decision must be Approved or Rejected' });
    }

    const approval = await Approval.findById(req.params.id);
    if (!approval) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    if (approval.status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Request already actioned' });
    }

    const isPrivileged = ['Owner', 'Admin'].includes(req.user.role);
    const isDesignatedApprover = approval.approver && approval.approver.equals(req.user._id);
    if (!isPrivileged && !isDesignatedApprover) {
      return res.status(403).json({ success: false, message: 'Not authorized to action this request' });
    }

    approval.status = decision;
    approval.actionedBy = req.user._id;
    approval.actionedAt = new Date();
    await approval.save();

    await notifyOne({
      recipient: approval.requester,
      type: 'approval_actioned',
      message: `Your ${approval.type} request "${approval.title}" was ${decision.toLowerCase()}`,
      relatedModule: 'approvals',
      relatedId: approval._id,
    });

    // Sync to Attendance: if this was a leave request with dates and got approved,
    // mark each day in range as 'leave' for the requester.
    if (decision === 'Approved' && approval.leaveStartDate && approval.leaveEndDate) {
      const Attendance = require('../attendance/attendance.model');
      const start = new Date(approval.leaveStartDate);
      const end = new Date(approval.leaveEndDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().slice(0, 10);
        await Attendance.findOneAndUpdate(
          { member: approval.requester, date: dateStr },
          { member: approval.requester, date: dateStr, status: 'leave', relatedApproval: approval._id },
          { upsert: true, new: true }
        );
      }
    }

    return res.status(200).json({ success: true, data: approval });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// --- Templates ---

// @route POST /api/approvals/templates (Admin/Owner)
const createTemplate = async (req, res) => {
  try {
    const { name, fields } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Template name is required' });
    }
    const template = await ApprovalTemplate.create({ name, fields, createdBy: req.user._id });
    return res.status(201).json({ success: true, data: template });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/approvals/templates
const getTemplates = async (req, res) => {
  try {
    const templates = await ApprovalTemplate.find().sort({ name: 1 });
    return res.status(200).json({ success: true, data: templates });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  submitRequest,
  getMyRequests,
  getPendingForApprover,
  actionRequest,
  createTemplate,
  getTemplates,
};
