import { describe, it, expect, vi, beforeEach } from 'vitest';
import timeService from '../services/timeService';
import repo from '../repositories/timeRepository';
import ticketsRepo from '../repositories/ticketsRepository';

vi.mock('../repositories/timeRepository', () => ({
  default: {
    getActiveTimerRaw: vi.fn(),
    createEntry: vi.fn(),
    clearActiveTimer: vi.fn(),
  },
}));
vi.mock('../repositories/ticketsRepository', () => ({ default: { addActivity: vi.fn() } }));
// withTransaction просто виконує fn із фейковим conn
vi.mock('../utils/withTransaction', () => ({ default: (fn: any) => fn({}) }));

const r = repo as any;
const tr = ticketsRepo as any;

describe('timeService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('stop', () => {
    it('throws 404 when no active timer', async () => {
      r.getActiveTimerRaw.mockResolvedValue(null);
      await expect(timeService.stop(1)).rejects.toMatchObject({ status: 404 });
    });

    it('rounds elapsed_seconds to minutes, logs activity, clears timer', async () => {
      r.getActiveTimerRaw.mockResolvedValue({
        project_id: 2,
        ticket_id: 3,
        description: null,
        started_at: new Date(),
        elapsed_seconds: 125, // -> 2 хв
      });
      r.createEntry.mockResolvedValue(10);
      r.clearActiveTimer.mockResolvedValue(undefined);
      tr.addActivity.mockResolvedValue(undefined);

      const res = await timeService.stop(1);

      expect(res).toEqual({ entry_id: 10, duration_minutes: 2 });
      expect(r.createEntry).toHaveBeenCalledOnce();
      expect(tr.addActivity).toHaveBeenCalledOnce(); // бо ticket_id заданий
      expect(r.clearActiveTimer).toHaveBeenCalledWith(1, {});
    });

    it('does not log activity when timer has no ticket', async () => {
      r.getActiveTimerRaw.mockResolvedValue({
        project_id: 2,
        ticket_id: null,
        description: null,
        started_at: new Date(),
        elapsed_seconds: 20,
      });
      r.createEntry.mockResolvedValue(11);
      const res = await timeService.stop(1);
      expect(res.duration_minutes).toBe(0); // 20s -> 0 хв
      expect(tr.addActivity).not.toHaveBeenCalled();
    });
  });

  describe('addManual', () => {
    it('creates entry and logs activity when ticketId present', async () => {
      r.createEntry.mockResolvedValue(20);
      const res = await timeService.addManual({ userId: 1, projectId: 2, ticketId: 3, durationMinutes: 30 });
      expect(res).toEqual({ entry_id: 20 });
      expect(tr.addActivity).toHaveBeenCalledOnce();
    });
    it('skips activity log when no ticket', async () => {
      r.createEntry.mockResolvedValue(21);
      await timeService.addManual({ userId: 1, projectId: 2, durationMinutes: 30 });
      expect(tr.addActivity).not.toHaveBeenCalled();
    });
  });
});
