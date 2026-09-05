const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['announcement', 'link', 'text', 'pinnedDocument'], required: true },
    title: String,
    content: String, // text/announcement body, or URL for link, or Document _id (as string) for pinnedDocument
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const workplaceSchema = new mongoose.Schema(
  {
    // Singleton per org - there's only ever one home/landing page
    blocks: { type: [blockSchema], default: [] },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgMember' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Workplace', workplaceSchema);
