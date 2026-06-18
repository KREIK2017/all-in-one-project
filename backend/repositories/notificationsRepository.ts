import { QueryTypes } from 'sequelize';
import sequelize from '../config/sequelize';
import { Notification } from '../models';

interface NotificationInput {
  userId: number;
  actorId: number | string;
  type: string;
  targetId: number | string;
  message: string;
}

export default {
  create({ userId, actorId, type, targetId, message }: NotificationInput) {
    return Notification.create({ user_id: userId, actor_id: actorId, type, target_id: targetId, message });
  },

  findForUser(userId: number) {
    return sequelize.query(
      `
      SELECT n.*, u.name AS actor_name, u.avatar_url AS actor_avatar_url, u.avatar_color AS actor_avatar_color
      FROM notifications n
      JOIN users u ON n.actor_id = u.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50
    `,
      { replacements: [userId], type: QueryTypes.SELECT }
    );
  },

  countUnread(userId: number) {
    return Notification.count({ where: { user_id: userId, is_read: 0 } });
  },

  markRead(id: number | string, userId: number) {
    return Notification.update({ is_read: 1 }, { where: { id, user_id: userId } });
  },

  markAllRead(userId: number) {
    return Notification.update({ is_read: 1 }, { where: { user_id: userId } });
  },
};
