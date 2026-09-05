const mongoose = require('mongoose');

const keyResultSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    targetValue: { type: Number, default: 100 },
    currentValue: { type: Number, default: 0 },
    unit: { type: String, default: '%' },
  },
  { _id: true }
);

const okrSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true }, // the Objective
    description: { type: String, default: '' },
    ownerType: { type: String, enum: ['individual', 'team'], default: 'individual' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgMember', required: true }, // individual owner or team lead
    keyResults: { type: [keyResultSchema], default: [] },
    linkedDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
    linkedTask: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', default: null },
    quarter: { type: String, default: null }, // e.g. "Q1-2026"
  },
  { timestamps: true }
);

// virtual overall progress = average % across key results
okrSchema.virtual('progress').get(function () {
  if (!this.keyResults.length) return 0;
  const total = this.keyResults.reduce((sum, kr) => sum + Math.min(100, (kr.currentValue / kr.targetValue) * 100 || 0), 0);
  return Math.round(total / this.keyResults.length);
});
okrSchema.set('toJSON', { virtuals: true });
okrSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Okr', okrSchema);
