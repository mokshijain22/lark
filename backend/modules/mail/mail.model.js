const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgMember', required: true },
    to: [{ type: mongoose.Schema.Types.ObjectId, ref: 'OrgMember', required: true }],
    subject: { type: String, default: '(no subject)' },
    body: { type: String, default: '' },
    attachments: [{ url: String, filename: String }],
    status: { type: String, enum: ['draft', 'sent'], default: 'sent' },
    isReadBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'OrgMember' }], // recipients who've opened it
  },
  { timestamps: true }
);

module.exports = mongoose.model('Email', emailSchema);
