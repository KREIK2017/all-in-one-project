import repo from '../repositories/timeRepository';
import ticketsRepo from '../repositories/ticketsRepository'; // перевикористовуємо addActivity
import AppError from '../utils/AppError';
import withTransaction from '../utils/withTransaction';

interface StartInput {
  userId: number;
  projectId: number | string;
  ticketId?: number | string | null;
  description?: string | null;
}

interface ManualInput {
  userId: number;
  projectId: number | string;
  ticketId?: number | string | null;
  durationMinutes: number;
  description?: string | null;
}

export default {
  getBilling({ start, end, userId }: { start?: string; end?: string; userId?: number | string }) {
    return repo.getBilling({ start, end, userId });
  },

  async start({ userId, projectId, ticketId, description }: StartInput) {
    // У користувача може бути лише один активний таймер — спершу гасимо попередній
    await repo.clearActiveTimer(userId);
    await repo.startTimer({ userId, projectId, ticketId, description });
    return { started_at: new Date() };
  },

  async stop(userId: number) {
    const timer = await repo.getActiveTimerRaw(userId);
    if (!timer) throw new AppError(404, 'No active timer');

    // ⬇️ Тривалість беремо з БД (elapsed_seconds від TIMESTAMPDIFF), а не з JS — без багу часових поясів
    const durationMinutes = Math.max(0, Math.round(timer.elapsed_seconds / 60));

    // Запис часу + лог активності + видалення активного таймера — атомарно
    return withTransaction(async (conn) => {
      const entryId = await repo.createEntry(
        {
          userId,
          projectId: timer.project_id,
          ticketId: timer.ticket_id,
          description: timer.description,
          startTime: timer.started_at,
          endTime: new Date(),
          durationMinutes,
        },
        conn
      );

      // Якщо таймер привʼязаний до тікета — пишемо в його активність
      if (timer.ticket_id) {
        await ticketsRepo.addActivity(
          {
            ticketId: timer.ticket_id,
            userId,
            type: 'time_log',
            content: `added ${durationMinutes} mins to time tracking`,
          },
          conn
        );
      }

      await repo.clearActiveTimer(userId, conn);
      return { entry_id: entryId, duration_minutes: durationMinutes };
    });
  },

  async getActiveTimer(userId: number | string) {
    const timer = await repo.getActiveTimerDetailed(userId);
    if (!timer) return { active: false };
    // elapsed_seconds уже порахований у БД — жодного new Date() над датою з БД
    return { active: true, ...timer };
  },

  async addManual({ userId, projectId, ticketId, durationMinutes, description }: ManualInput) {
    const now = new Date();
    // Запис часу + лог активності — атомарно (або обидва, або жодного)
    return withTransaction(async (conn) => {
      const entryId = await repo.createEntry(
        {
          userId,
          projectId,
          ticketId,
          description,
          startTime: now,
          endTime: now,
          durationMinutes,
          isManual: 1,
        },
        conn
      );

      if (ticketId) {
        const action = durationMinutes > 0 ? 'added' : 'removed';
        const absMinutes = Math.abs(durationMinutes);
        await ticketsRepo.addActivity(
          {
            ticketId,
            userId,
            type: 'time_log',
            content: `${action} ${absMinutes} mins to time tracking (manual)`,
          },
          conn
        );
      }
      return { entry_id: entryId };
    });
  },

  editEntry(id: number | string, { durationMinutes, userId }: { durationMinutes: number; userId: number }) {
    return repo.updateEntry(id, { durationMinutes, userId });
  },
};
