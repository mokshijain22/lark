const mongoose = require('mongoose');

const sheetTabSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    cells: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} }, // key "A1" -> { value, formula, format: {bold,color,border,numberFormat} }
    charts: { type: [mongoose.Schema.Types.Mixed], default: [] }, // simple chart configs referencing cell ranges
  },
  { _id: false }
);

const spreadsheetSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgMember', required: true },
    tabs: { type: [sheetTabSchema], default: [{ name: 'Sheet1', cells: {}, charts: [] }] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Spreadsheet', spreadsheetSchema);
