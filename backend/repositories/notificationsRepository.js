const pool = require('../db');

module.exports = {
  create({ userId, actorId, type, targetId, message }) {
    return pool.query(
      'INSERT INTO notifications (user_id, actor_id, type, target_id, message) VALUES (?, ?, ?, ?, ?)',
      [userId, actorId, type, targetId, message]
    );
  },
    findForUser(userId) {
    return pool.query(`
      SELECT n.*, u.name AS actor_name, u.avatar_url AS actor_avatar_url, u.avatar_color AS actor_avatar_color
      FROM notifications n
      JOIN users u ON n.actor_id = u.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [userId]).then(([r]) => r);
  },

  countUnread(userId) {
    return pool
      .query('SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0', [userId])
      .then(([r]) => r[0].count);
  },

  markRead(id, userId) {
    return pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, userId]);
  },

  markAllRead(userId) {
    return pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
  },

};
