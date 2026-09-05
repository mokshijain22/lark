const Document = require('./document.model');

const canEdit = (doc, user) => {
  if (doc.author.equals(user._id)) return true;
  if (['Owner', 'Admin'].includes(user.role)) return true;
  if (doc.editPermission === 'anyone') return true;
  return doc.editors.some((e) => e.equals(user._id));
};

// POST /api/docs
const createDocument = async (req, res) => {
  try {
    const { title, content, folder, editPermission, isTemplate, templateType } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'title is required' });

    const doc = await Document.create({
      title, content, folder, editPermission, isTemplate, templateType,
      author: req.user._id,
    });
    return res.status(201).json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/docs?folder=xyz  (list/folder structure)
const getDocuments = async (req, res) => {
  try {
    const { folder, search } = req.query;
    const filter = {};
    if (folder) filter.folder = folder;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const docs = await Document.find(filter).select('-content -versions').populate('author', 'name avatar').sort({ updatedAt: -1 });
    return res.status(200).json({ success: true, data: docs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/docs/templates
const getTemplates = async (req, res) => {
  try {
    const docs = await Document.find({ isTemplate: true }).select('-versions');
    return res.status(200).json({ success: true, data: docs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/docs/:id
const getDocumentById = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id).populate('author', 'name avatar').populate('editors', 'name avatar');
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/docs/:id  (autosave)
const updateDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    if (!canEdit(doc, req.user)) return res.status(403).json({ success: false, message: 'Not authorized to edit this document' });

    // Push current content to version history before overwriting
    if (req.body.content !== undefined && req.body.content !== doc.content) {
      doc.versions.push({ content: doc.content, editedBy: req.user._id });
      if (doc.versions.length > 50) doc.versions.shift(); // cap history
      doc.content = req.body.content;
    }
    ['title', 'folder', 'editPermission', 'editors'].forEach((f) => {
      if (req.body[f] !== undefined) doc[f] = req.body[f];
    });

    await doc.save();
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/docs/:id/versions
const getVersions = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id).select('versions').populate('versions.editedBy', 'name avatar');
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    return res.status(200).json({ success: true, data: doc.versions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/docs/:id/revert  { versionIndex }
const revertVersion = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    if (!canEdit(doc, req.user)) return res.status(403).json({ success: false, message: 'Not authorized' });

    const { versionIndex } = req.body;
    const version = doc.versions[versionIndex];
    if (!version) return res.status(400).json({ success: false, message: 'Invalid version index' });

    doc.versions.push({ content: doc.content, editedBy: req.user._id });
    doc.content = version.content;
    await doc.save();
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/docs/:id
const deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Document not found' });
    const isPrivileged = ['Owner', 'Admin'].includes(req.user.role);
    if (!doc.author.equals(req.user._id) && !isPrivileged) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this document' });
    }
    await doc.deleteOne();
    return res.status(200).json({ success: true, message: 'Document deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createDocument, getDocuments, getTemplates, getDocumentById, updateDocument, getVersions, revertVersion, deleteDocument };
