const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const orgMemberSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    avatar: { type: String, default: null },
    role: { type: String, enum: ['Owner', 'Admin', 'Member'], default: 'Member' },
    status: { type: String, enum: ['online', 'offline'], default: 'offline' },
    lastSeen: { type: Date, default: Date.now },
    preferredLanguage: { type: String, default: 'en' }, // used by Auto-translation module
  },
  { timestamps: true }
);

orgMemberSchema.index({ name: 'text' });

// Hash password before saving
orgMemberSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

orgMemberSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('OrgMember', orgMemberSchema);
