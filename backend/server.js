require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./shared/config/db');
const { initSocket } = require('./shared/config/socket');
const { startCronJobs } = require('./shared/services/cron.service');

// Module routes
const authRoutes = require('./modules/auth/auth.routes');
const contactRoutes = require('./modules/contacts/contact.routes');
const approvalRoutes = require('./modules/approvals/approval.routes');
const calendarRoutes = require('./modules/calendar/event.routes');
const taskRoutes = require('./modules/tasks/task.routes');
const docRoutes = require('./modules/docs/document.routes');
const baseRoutes = require('./modules/base/base.routes');
const sheetRoutes = require('./modules/sheets/spreadsheet.routes');
const slideRoutes = require('./modules/slides/presentation.routes');
const okrRoutes = require('./modules/okr/okr.routes');
const attendanceRoutes = require('./modules/attendance/attendance.routes');
const mailRoutes = require('./modules/mail/mail.routes');
const minutesRoutes = require('./modules/minutes/minutes.routes');
const shareRoutes = require('./modules/magicshare/share.routes');
const automationRoutes = require('./modules/anycross/automation.routes');
const translationRoutes = require('./modules/translation/translation.routes');
const workplaceRoutes = require('./modules/workplace/workplace.routes');
const integrationRoutes = require('./modules/integrations/integration.routes');
const notificationRoutes = require('./modules/notifications/notification.routes');

connectDB();

const app = express();
const httpServer = http.createServer(app); // needed so socket.io can share the same port as Express

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, message: 'Nook backend running' }));

// Mount each module under its own base path — self-contained & easy to remove/reuse
app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/docs', docRoutes);
app.use('/api/base', baseRoutes);
app.use('/api/sheets', sheetRoutes);
app.use('/api/slides', slideRoutes);
app.use('/api/okr', okrRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/mail', mailRoutes);
app.use('/api/minutes', minutesRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/anycross', automationRoutes);
app.use('/api/translation', translationRoutes);
app.use('/api/workplace', workplaceRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server error' });
});

initSocket(httpServer); // real-time notifications - see shared/config/socket.js
startCronJobs(); // Anycross time-based automations - see shared/services/cron.service.js

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Nook backend (HTTP + Socket.io) listening on port ${PORT}`));
