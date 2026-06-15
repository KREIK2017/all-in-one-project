const pool = require('../db');

module.exports = {
  countOpenTickets() {
    return pool
      .query("SELECT COUNT(*) AS c FROM tickets WHERE status != 'COMPLETED' AND status != 'CLOSED'")
      .then(([r]) => r[0].c);
  },

  sumMinutesLast7Days() {
    return pool
      .query('SELECT SUM(duration_minutes) AS m FROM time_entries WHERE start_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)')
      .then(([r]) => r[0].m);
  },

  topProjectName() {
    return pool.query(`
      SELECT p.name
      FROM time_entries te
      JOIN projects p ON te.project_id = p.id
      GROUP BY p.id
      ORDER BY SUM(te.duration_minutes) DESC
      LIMIT 1
    `).then(([r]) => r[0]?.name);
  },

  countActiveUsers() {
    return pool.query(`
      SELECT COUNT(DISTINCT user_id) AS c FROM (
        SELECT user_id FROM activity WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
        UNION
        SELECT user_id FROM active_timers
      ) AS active
    `).then(([r]) => r[0].c);
  },

  hoursPerDayLast7Days() {
    return pool.query(`
      SELECT DATE_FORMAT(start_time, '%Y-%m-%d') AS date, SUM(duration_minutes)/60 AS hours
      FROM time_entries
      WHERE start_time >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(start_time)
      ORDER BY date ASC
    `).then(([r]) => r);
  },
};
