import notificationsRepo from '../repositories/notificationsRepository';
import { sendNotificationEmail } from './emailService';

interface NotifyParams {
  recipient: { id: number; email?: string | null };
  actorId: number | string;
  type: string;
  targetId: number | string;
  message: string;
  emailSubject: string;
  emailHtml: string;
}

// Сповіщення — побічний ефект. Воно НЕ повинне ламати основну дію (коментар/оновлення),
// тому все загорнуто в try/catch і лише логується.
async function notify({ recipient, actorId, type, targetId, message, emailSubject, emailHtml }: NotifyParams) {
  try {
    await notificationsRepo.create({ userId: recipient.id, actorId, type, targetId, message });
    if (recipient.email) {
      await sendNotificationEmail(recipient.email, emailSubject, message, emailHtml);
    }
  } catch (err) {
    console.error(`[Notification Error - ${type}]:`, err);
  }
}

function listForUser(userId: number) {
  return notificationsRepo.findForUser(userId);
}
function unreadCount(userId: number) {
  return notificationsRepo.countUnread(userId);
}
function markRead(id: number | string, userId: number) {
  return notificationsRepo.markRead(id, userId);
}
function markAllRead(userId: number) {
  return notificationsRepo.markAllRead(userId);
}

export default { notify, listForUser, unreadCount, markRead, markAllRead };
