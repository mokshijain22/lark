const mongoose = require('mongoose');

const slideSchema = new mongoose.Schema(
  {
    order: { type: Number, required: true },
    elements: { type: [mongoose.Schema.Types.Mixed], default: [] }, // [{type:'text'|'image'|'shape'|'table', x,y,w,h, content/src/rows}]
    background: { type: String, default: '#FFFFFF' },
  },
  { _id: true }
);

const presentationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgMember', required: true },
    theme: { type: String, default: 'default' },
    slides: { type: [slideSchema], default: [{ order: 0, elements: [], background: '#FFFFFF' }] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Presentation', presentationSchema);
