const Notification = require('../models/Notification');
const { emitToUser } = require('../config/socket');

// Creates one notification and pushes it live to the recipient if they're connected.
// Use this instead of calling Notification.create() directly anywhere in the app.
const notifyOne = async ({ recipient, type, message, relatedModule, relatedId }) => {
  const notification = await Notification.create({ recipient, type, message, relatedModule, relatedId });
  emitToUser(recipient, 'notification', notification);
  return notification;
};

// Same as notifyOne but for multiple recipients at once (replaces Notification.insertMany).
const notifyMany = async (recipients, { type, message, relatedModule, relatedId }) => {
  const docs = await Notification.insertMany(
    recipients.map((recipient) => ({ recipient, type, message, relatedModule, relatedId }))
  );
  docs.forEach((doc) => emitToUser(doc.recipient, 'notification', doc));
  return docs;
};

module.exports = { notifyOne, notifyMany };
