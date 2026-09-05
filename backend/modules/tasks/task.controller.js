const Task = require('./task.model');
const { notifyOne } = require('../../shared/services/notify.service');

// @route POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { title, description, dueDate, assignee, priority, project } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'title is required' });
    }

    const task = await Task.create({
      title,
      description,
      dueDate,
      assignee: assignee || null,
      createdBy: req.user._id,
      priority,
      project,
    });

    if (assignee && assignee !== String(req.user._id)) {
      await notifyOne({
        recipient: assignee,
        type: 'task_assigned',
        message: `${req.user.name} assigned you a task: "${title}"`,
        relatedModule: 'tasks',
        relatedId: task._id,
      });
    }

    return res.status(201).json({ success: true, data: task });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/tasks/assigned-to-me
const getAssignedToMe = async (req, res) => {
  try {
    const { status, project } = req.query;
    const filter = { assignee: req.user._id };
    if (status) filter.status = status;
    if (project) filter.project = project;

    const tasks = await Task.find(filter)
      .populate('createdBy', 'name avatar')
      .sort({ dueDate: 1 });

    return res.status(200).json({ success: true, data: tasks });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/tasks/created-by-me
const getCreatedByMe = async (req, res) => {
  try {
    const { status, project } = req.query;
    const filter = { createdBy: req.user._id };
    if (status) filter.status = status;
    if (project) filter.project = project;

    const tasks = await Task.find(filter)
      .populate('assignee', 'name avatar')
      .sort({ dueDate: 1 });

    return res.status(200).json({ success: true, data: tasks });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/tasks/:id
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('createdBy', 'name avatar')
      .populate('assignee', 'name avatar');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    return res.status(200).json({ success: true, data: task });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const isOwnerOfTask = task.createdBy.equals(req.user._id) || (task.assignee && task.assignee.equals(req.user._id));
    const isPrivileged = ['Owner', 'Admin'].includes(req.user.role);
    if (!isOwnerOfTask && !isPrivileged) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this task' });
    }

    const allowedFields = ['title', 'description', 'dueDate', 'assignee', 'priority', 'status', 'project'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });

    await task.save();
    return res.status(200).json({ success: true, data: task });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// @route DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const isPrivileged = ['Owner', 'Admin'].includes(req.user.role);
    if (!task.createdBy.equals(req.user._id) && !isPrivileged) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this task' });
    }

    await task.deleteOne();
    return res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createTask, getAssignedToMe, getCreatedByMe, getTaskById, updateTask, deleteTask };
