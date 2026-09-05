const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, // client-generated short id, referenced by row data keys
    name: { type: String, required: true },
    type: { type: String, enum: ['text', 'number', 'dropdown', 'date', 'checkbox', 'attachment', 'link'], default: 'text' },
    options: [String], // for dropdown
    linkedTable: { type: mongoose.Schema.Types.ObjectId, ref: 'BaseTable', default: null }, // for link-to-another-table
  },
  { _id: false }
);

const rowSchema = new mongoose.Schema(
  { data: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} } }, // columnId -> value
  { timestamps: true }
);

const viewSchema = new mongoose.Schema(
  {
    name: String,
    type: { type: String, enum: ['grid', 'kanban', 'calendar'], default: 'grid' },
    kanbanGroupByColumn: { type: String, default: null },
    filters: { type: mongoose.Schema.Types.Mixed, default: [] },
    sort: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: true }
);

const automationRuleSchema = new mongoose.Schema(
  {
    name: String,
    triggerColumn: String, // column id whose change triggers the rule
    triggerValue: String, // e.g. "Done"
    notifyMember: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgMember' },
  },
  { _id: true }
);

const baseTableSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'OrgMember', required: true },
    columns: { type: [columnSchema], default: [] },
    rows: { type: [rowSchema], default: [] },
    views: { type: [viewSchema], default: [] },
    automations: { type: [automationRuleSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BaseTable', baseTableSchema);
