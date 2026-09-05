const mongoose = require('mongoose');

const templateFieldSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    fieldType: {
      type: String,
      enum: ['text', 'textarea', 'number', 'date', 'file'],
      default: 'text',
    },
  },
  { _id: false }
);

const approvalTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Leave Request"
    fields: { type: [templateFieldSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgMember', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ApprovalTemplate', approvalTemplateSchema);
