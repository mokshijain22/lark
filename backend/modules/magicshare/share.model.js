const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema(
  {
    itemType: { type: String, enum: ['document', 'spreadsheet', 'presentation', 'event', 'task', 'baseTable'], required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    sharedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgMember', required: true },
    sharedWith: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgMember', required: true },
    permission: { type: String, enum: ['view', 'edit'], default: 'view' },
    // Snapshot fields for the live preview card (title/last-edited) so the frontend doesn't
    // need to look up the source item just to render the card in chat.
    previewTitle: { type: String, default: '' },
    previewLastEditedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Share', shareSchema);
