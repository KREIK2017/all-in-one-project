import { QueryTypes, Transaction } from 'sequelize';
import sequelize from '../config/sequelize';
import { TimeEntry, ActiveTimer } from '../models';

interface TimeEntryInput {
  userId: number;
  projectId: number | string;
  ticketId?: number | string | null;
  description?: string | null;
  startTime: Date | string;
  endTime: Date | string;
  durationMinutes: number;
  isManual?: number;
}

export default {
  // Білінг для сторінки звітів: сума хвилин по проєкту й дню
  getBilling({ start, end, userId }: { start?: string; end?: string; userId?: number | string }) {
    let sql = `
      SELECT
        p.name AS project_name,
        p.color,
        DATE_FORMAT(te.start_time, '%Y-%m-%d') AS work_date,
        SUM(te.duration_minutes) AS total_minutes
      FROM time_entries te
      JOIN projects p ON te.project_id = p.id
      WHERE te.start_time >= ? AND te.start_time <= ?
    `;
    const replacements: any[] = [start || '2026-01-01', end || '2099-01-01'];
    if (userId) {
      sql += ' AND te.user_id = ? ';
      replacements.push(userId);
    }
    sql += ' GROUP BY p.id, DATE(te.start_time) ORDER BY p.name, work_date';
    return sequelize.query(sql, { replacements, type: QueryTypes.SELECT });
  },

  // "Сирий" активний таймер (+ elapsed_seconds з БД) — для stop
  async getActiveTimerRaw(userId: number | string) {
    const rows = (await sequelize.query(
      'SELECT *, TIMESTAMPDIFF(SECOND, started_at, NOW()) AS elapsed_seconds FROM active_timers WHERE user_id = ?',
      { replacements: [userId], type: QueryTypes.SELECT }
    )) as any[];
    return rows[0];
  },

  // Активний таймер з назвами проєкту/тікета (+ elapsed_seconds) — для віджета
  async getActiveTimerDetailed(userId: number | string) {
    const rows = (await sequelize.query(
      `
      SELECT at.*,
             TIMESTAMPDIFF(SECOND, at.started_at, NOW()) AS elapsed_seconds,
             p.name AS project_name,
             t.subject AS ticket_subject
      FROM active_timers at
      LEFT JOIN projects p ON at.project_id = p.id
      LEFT JOIN tickets t ON at.ticket_id = t.id
      WHERE at.user_id = ?
    `,
      { replacements: [userId], type: QueryTypes.SELECT }
    )) as any[];
    return rows[0];
  },

  clearActiveTimer(userId: number | string, transaction?: Transaction) {
    return ActiveTimer.destroy({ where: { user_id: userId }, transaction });
  },

  startTimer({
    userId,
    projectId,
    ticketId,
    description,
  }: {
    userId: number;
    projectId: number | string;
    ticketId?: number | string | null;
    description?: string | null;
  }) {
    return ActiveTimer.create({
      user_id: userId,
      project_id: projectId,
      ticket_id: ticketId || null,
      description: description || null,
      started_at: sequelize.fn('NOW'),
    } as any);
  },

  // Універсальний запис часу (і для stop, і для ручного вводу).
  async createEntry(
    { userId, projectId, ticketId, description, startTime, endTime, durationMinutes, isManual = 0 }: TimeEntryInput,
    transaction?: Transaction
  ) {
    const entry = await TimeEntry.create(
      {
        user_id: userId,
        project_id: projectId,
        ticket_id: ticketId || null,
        description: description || null,
        start_time: startTime,
        end_time: endTime,
        duration_minutes: durationMinutes,
        is_manual: isManual,
      },
      { transaction }
    );
    return entry.get('id') as number;
  },

  updateEntry(id: number | string, { durationMinutes, userId }: { durationMinutes: number; userId: number }) {
    return TimeEntry.update(
      { duration_minutes: durationMinutes, is_manual: 1, edited_by: userId, edited_at: sequelize.fn('NOW') } as any,
      { where: { id } }
    );
  },
};
