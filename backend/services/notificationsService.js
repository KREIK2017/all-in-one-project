const notificationsRepo = require('../repositories/notificationsRepository');
const { sendNotificationEmail } = require('./emailService');

// Сповіщення — побічний ефект. Воно НЕ повинне ламати основну дію (коментар/оновлення),
// тому все загорнуто в try/catch і лише логується.
async function notify({ recipient, actorId, type, targetId, message, emailSubject, emailHtml }) {
  try {
    await notificationsRepo.create({ userId: recipient.id, actorId, type, targetId, message });
    if (recipient.email) {
      await sendNotificationEmail(recipient.email, emailSubject, message, emailHtml);
    }
  } catch (err) {
    console.error(`[Notification Error - ${type}]:`, err);
  }
}
function listForUser(userId) { return notificationsRepo.findForUser(userId); }
function unreadCount(userId) { return notificationsRepo.countUnread(userId); }
function markRead(id, userId) { return notificationsRepo.markRead(id, userId); }
function markAllRead(userId) { return notificationsRepo.markAllRead(userId); }

module.exports = { notify, listForUser, unreadCount, markRead, markAllRead };
