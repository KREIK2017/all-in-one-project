const repo = require('../repositories/timeRepository');
const ticketsRepo = require('../repositories/ticketsRepository'); // перевикористовуємо addActivity
const AppError = require('../utils/AppError');

module.exports = {
  getBilling({ start, end, userId }) {
    return repo.getBilling({ start, end, userId });
  },

  async start({ userId, projectId, ticketId, description }) {
    // У користувача може бути лише один активний таймер — спершу гасимо попередній
    await repo.clearActiveTimer(userId);
    await repo.startTimer({ userId, projectId, ticketId, description });
    return { started_at: new Date() };
  },

  async stop(userId) {
    const timer = await repo.getActiveTimerRaw(userId);
    if (!timer) throw new AppError(404, 'No active timer');

    // ⬇️ Тривалість беремо з БД (elapsed_seconds від TIMESTAMPDIFF), а не з JS — без багу часових поясів
    const durationMinutes = Math.max(0, Math.round(timer.elapsed_seconds / 60));

    const entryId = await repo.createEntry({
      userId,
      projectId: timer.project_id,
      ticketId: timer.ticket_id,
      description: timer.description,
      startTime: timer.started_at,
      endTime: new Date(),
      durationMinutes,
    });

    // Якщо таймер привʼязаний до тікета — пишемо в його активність
    if (timer.ticket_id) {
      await ticketsRepo.addActivity({
        ticketId: timer.ticket_id,
        userId,
        type: 'time_log',
        content: `added ${durationMinutes} mins to time tracking`,
      });
    }

    await repo.clearActiveTimer(userId);
    return { entry_id: entryId, duration_minutes: durationMinutes };
  },

  async getActiveTimer(userId) {
    const timer = await repo.getActiveTimerDetailed(userId);
    if (!timer) return { active: false };
    // elapsed_seconds уже порахований у БД — жодного new Date() над датою з БД
    return { active: true, ...timer };
  },

  async addManual({ userId, projectId, ticketId, durationMinutes, description }) {
    const now = new Date();
    const entryId = await repo.createEntry({
      userId, projectId, ticketId, description,
      startTime: now, endTime: now, durationMinutes, isManual: 1,
    });

    if (ticketId) {
      const action = durationMinutes > 0 ? 'added' : 'removed';
      const absMinutes = Math.abs(durationMinutes);
      await ticketsRepo.addActivity({
        ticketId, userId, type: 'time_log',
        content: `${action} ${absMinutes} mins to time tracking (manual)`,
      });
    }
    return { entry_id: entryId };
  },

  editEntry(id, { durationMinutes, userId }) {
    return repo.updateEntry(id, { durationMinutes, userId });
  },
};
