const pool = require('../db');

module.exports = {
  // Білінг для сторінки звітів: сума хвилин по проєкту й дню
  getBilling({ start, end, userId }) {
    let query = `
      SELECT
        p.name AS project_name,
        p.color,
        DATE_FORMAT(te.start_time, '%Y-%m-%d') AS work_date,
        SUM(te.duration_minutes) AS total_minutes
      FROM time_entries te
      JOIN projects p ON te.project_id = p.id
      WHERE te.start_time >= ? AND te.start_time <= ?
    `;
    const params = [start || '2026-01-01', end || '2099-01-01'];
    if (userId) {
      query += ' AND te.user_id = ? ';
      params.push(userId);
    }
    query += ' GROUP BY p.id, DATE(te.start_time) ORDER BY p.name, work_date';
    return pool.query(query, params).then(([r]) => r);
  },

    getActiveTimerRaw(userId) {
    return pool
      .query(
        'SELECT *, TIMESTAMPDIFF(SECOND, started_at, NOW()) AS elapsed_seconds FROM active_timers WHERE user_id = ?',
        [userId]
      )
      .then(([r]) => r[0]);
  },

  getActiveTimerDetailed(userId) {
    return pool.query(`
      SELECT at.*,
             TIMESTAMPDIFF(SECOND, at.started_at, NOW()) AS elapsed_seconds,
             p.name AS project_name,
             t.subject AS ticket_subject
      FROM active_timers at
      LEFT JOIN projects p ON at.project_id = p.id
      LEFT JOIN tickets t ON at.ticket_id = t.id
      WHERE at.user_id = ?
    `, [userId]).then(([r]) => r[0]);
  },


  clearActiveTimer(userId) {
    return pool.query('DELETE FROM active_timers WHERE user_id = ?', [userId]);
  },

  startTimer({ userId, projectId, ticketId, description }) {
    return pool.query(
      `INSERT INTO active_timers (user_id, project_id, ticket_id, description, started_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [userId, projectId, ticketId || null, description || null]
    );
  },

  // Універсальний запис часу (і для stop, і для ручного вводу)
  createEntry({ userId, projectId, ticketId, description, startTime, endTime, durationMinutes, isManual = 0 }) {
    return pool.query(
      `INSERT INTO time_entries
         (user_id, project_id, ticket_id, description, start_time, end_time, duration_minutes, is_manual)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, projectId, ticketId || null, description || null, startTime, endTime, durationMinutes, isManual]
    ).then(([r]) => r.insertId);
  },

  updateEntry(id, { durationMinutes, userId }) {
    return pool.query(
      `UPDATE time_entries
         SET duration_minutes = ?, is_manual = 1, edited_by = ?, edited_at = NOW()
       WHERE id = ?`,
      [durationMinutes, userId, id]
    );
  },
};
