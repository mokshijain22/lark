const cron = require('node-cron');

// Checks every minute whether any active 'schedule' automation matches the
// current HH:MM, and fires its action if so. Runs in-process — fine for a
// single backend instance; move to a dedicated worker/queue if scaling out.
const startCronJobs = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const Automation = require('../../modules/anycross/automation.model');
      const OrgMember = require('../models/OrgMember');
      const { notifyMany } = require('./notify.service');

      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const dueRules = await Automation.find({
        isActive: true,
        'trigger.module': 'schedule',
        'trigger.time': currentTime,
      });

      for (const rule of dueRules) {
        // Avoid firing twice in the same minute if the server restarts mid-minute
        if (rule.lastRunAt && now - rule.lastRunAt < 55 * 1000) continue;

        if (rule.action.type === 'send_channel_message') {
          // No chat channel to post into yet (Nook chat code isn't available here),
          // so this surfaces as a notification to everyone for now.
          const members = await OrgMember.find().select('_id');
          await notifyMany(members.map((m) => m._id), {
            type: 'event_invite', // reused generic type for MVP
            message: `[Automation: ${rule.name}] ${rule.action.message}`,
            relatedModule: 'tasks',
            relatedId: rule._id,
          });
        } else if (rule.action.type === 'add_base_row' && rule.action.targetTableId) {
          const BaseTable = require('../../modules/base/base.model');
          const table = await BaseTable.findById(rule.action.targetTableId);
          if (table) {
            table.rows.push({ data: {} });
            await table.save();
          }
        }

        rule.lastRunAt = now;
        await rule.save();
      }
    } catch (err) {
      console.error('Cron job error (Anycross schedule check):', err.message);
    }
  });

  console.log('Anycross cron scheduler started (checks every minute)');
};

module.exports = { startCronJobs };
