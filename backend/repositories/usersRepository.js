const pool = require('../db');

module.exports = {
  // --- читання ---
  findAll() {
    return pool
      .query('SELECT id, name, email, role, handle, avatar_color, avatar_url, status, created_at FROM users ORDER BY name ASC')
      .then(([rows]) => rows);
  },

  findById(id) {
    return pool
      .query('SELECT * FROM users WHERE id = ?', [id])
      .then(([rows]) => rows[0]);   // повертаємо один об'єкт або undefined
  },

  findByMention(username) {
    return pool
      .query('SELECT id, email, name FROM users WHERE name = ? OR email LIKE ?', [username, `${username}%`])
      .then(([r]) => r[0]);
  },
  findByEmail(email) {
    return pool.query('SELECT * FROM users WHERE email = ?', [email]).then(([r]) => r[0]);
  },

  createUser({ name, email, passwordHash }) {
    return pool
      .query('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [name, email, passwordHash])
      .then(([r]) => r.insertId);
  },

  // Безпечні поля профілю (без password_hash) — для /me
  findProfileById(id) {
    return pool
      .query('SELECT id, name, email, role, handle, avatar_color, avatar_url, theme, font FROM users WHERE id = ?', [id])
      .then(([r]) => r[0]);
  },

  // --- зміни ---
  updateRole(id, role) {
    return pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
  },
  // --- профіль ---
  getProfileFields(id) {
    return pool
      .query('SELECT name, email, avatar_color, handle, theme, font FROM users WHERE id = ?', [id])
      .then(([r]) => r[0]);
  },

  updateProfile(id, p) {
    return pool.query(
      'UPDATE users SET name = ?, email = ?, avatar_color = ?, handle = ?, theme = ?, font = ? WHERE id = ?',
      [p.name, p.email, p.avatar_color, p.handle, p.theme, p.font, id]
    );
  },
  updateAvatar(id, url) {
    return pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [url, id]);
  },

  handleTakenByOther(handle, excludeId) {
    return pool
      .query('SELECT id FROM users WHERE handle = ? AND id != ?', [handle, excludeId])
      .then(([r]) => r.length > 0);
  },

  emailTakenByOther(email, excludeId) {
    return pool
      .query('SELECT id FROM users WHERE email = ? AND id != ?', [email, excludeId])
      .then(([r]) => r.length > 0);
  },

  handleExists(handle) {
    return pool.query('SELECT id FROM users WHERE handle = ?', [handle]).then(([r]) => r.length > 0);
  },

  // --- публічний профіль + статистика ---
  findPublicProfile(id) {
    return pool
      .query('SELECT id, name, email, handle, avatar_color, avatar_url, created_at FROM users WHERE id = ?', [id])
      .then(([r]) => r[0]);
  },

  async getUserStats(id) {
    const [[t]] = await pool.query('SELECT COUNT(*) AS count FROM tickets WHERE assignee_id = ?', [id]);
    const [[p]] = await pool.query('SELECT COUNT(DISTINCT project_id) AS count FROM time_entries WHERE user_id = ?', [id]);
    const [[m]] = await pool.query('SELECT SUM(duration_minutes) AS minutes FROM time_entries WHERE user_id = ?', [id]);
    return { tickets: t.count, projects: p.count, minutes: m.minutes || 0 };
  },

  // --- пароль / статус ---
  getPasswordHash(id) {
    return pool.query('SELECT password_hash FROM users WHERE id = ?', [id]).then(([r]) => r[0]?.password_hash);
  },

  updatePassword(id, passwordHash) {
    return pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
  },

  updateStatus(id, status) {
    return pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
  },

  // Видалення разом із залежностями — в ОДНІЙ транзакції (це і лагодить FK-помилку)
  async deleteWithDependents(id) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      // Спершу таблиці, які тримають FK на users (інакше БД блокує видалення):
      await conn.query('DELETE FROM activity      WHERE user_id = ?', [id]);
      await conn.query('DELETE FROM time_entries  WHERE user_id = ?', [id]);
      await conn.query('DELETE FROM notifications WHERE user_id = ? OR actor_id = ?', [id, id]);
      await conn.query('DELETE FROM tickets        WHERE created_by = ?', [id]);
      // Тепер самого користувача:
      await conn.query('DELETE FROM users          WHERE id = ?', [id]);
      await conn.commit();
    } catch (e) {
      await conn.rollback();   // якщо щось впало — відкатуємо все, БД лишається цілою
      throw e;
    } finally {
      conn.release();          // обов'язково повертаємо з'єднання в пул
    }
  },
};
