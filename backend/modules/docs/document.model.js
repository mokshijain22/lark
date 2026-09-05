const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema(
  { content: String, editedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgMember' }, editedAt: { type: Date, default: Date.now } },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: '' }, // rich text stored as HTML
    folder: { type: String, default: null }, // simple folder path string for list/tree structure
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgMember', required: true },
    editPermission: { type: String, enum: ['author', 'anyone'], default: 'anyone' },
    editors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'OrgMember' }], // used when editPermission === 'specific'
    isTemplate: { type: Boolean, default: false },
    templateType: { type: String, default: null }, // e.g. "meeting-notes", "project-plan"
    versions: { type: [versionSchema], default: [] }, // history for revert
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
