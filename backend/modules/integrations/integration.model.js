const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: ['jira', 'github', 'google_drive', 'trello'], required: true, unique: true },
    isConnected: { type: Boolean, default: false },
    connectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgMember', default: null },
    // OAuth/token details would go here once real provider auth is wired up.
    accessToken: { type: String, default: null, select: false },
    refreshToken: { type: String, default: null, select: false },
    providerUserId: { type: String, default: null },
    providerUsername: { type: String, default: null },
    webhookSecret: { type: String, default: null, select: false },
    connectedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Integration', integrationSchema);
