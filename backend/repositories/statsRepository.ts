import { QueryTypes } from 'sequelize';
import sequelize from '../config/sequelize';

export default {
  async countOpenTickets() {
    const r = (await sequelize.query(
      "SELECT COUNT(*) AS c FROM tickets WHERE status != 'COMPLETED' AND status != 'CLOSED'",
      { type: QueryTypes.SELECT }
    )) as any[];
    return r[0].c as number;
  },

  async sumMinutesLast7Days() {
    const r = (await sequelize.query(
      'SELECT SUM(duration_minutes) AS m FROM time_entries WHERE start_time >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
      { type: QueryTypes.SELECT }
    )) as any[];
    return r[0].m as number | null;
  },

  async topProjectName() {
    const r = (await sequelize.query(
      `
      SELECT p.name
      FROM time_entries te
      JOIN projects p ON te.project_id = p.id
      GROUP BY p.id
      ORDER BY SUM(te.duration_minutes) DESC
      LIMIT 1
    `,
      { type: QueryTypes.SELECT }
    )) as any[];
    return r[0]?.name as string | undefined;
  },

  async countActiveUsers() {
    const r = (await sequelize.query(
      `
      SELECT COUNT(DISTINCT user_id) AS c FROM (
        SELECT user_id FROM activity WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)
        UNION
        SELECT user_id FROM active_timers
      ) AS active
    `,
      { type: QueryTypes.SELECT }
    )) as any[];
    return r[0].c as number;
  },

  hoursPerDayLast7Days() {
    return sequelize.query(
      `
      SELECT DATE_FORMAT(start_time, '%Y-%m-%d') AS date, SUM(duration_minutes)/60 AS hours
      FROM time_entries
      WHERE start_time >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(start_time)
      ORDER BY date ASC
    `,
      { type: QueryTypes.SELECT }
    );
  },
};
