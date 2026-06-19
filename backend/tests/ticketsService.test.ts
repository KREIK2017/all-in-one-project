import { describe, it, expect, vi, beforeEach } from 'vitest';
import ticketsService from '../services/ticketsService';
import repo from '../repositories/ticketsRepository';

vi.mock('../repositories/ticketsRepository', () => ({
  default: {
    findById: vi.fn(),
    findActivity: vi.fn(),
    findRaw: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    addActivity: vi.fn(),
  },
}));
vi.mock('../repositories/usersRepository', () => ({ default: { findById: vi.fn(), findByMention: vi.fn() } }));
vi.mock('../services/notificationsService', () => ({ default: { notify: vi.fn() } }));

const r = repo as any;

describe('ticketsService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('getOne', () => {
    it('throws 404 if ticket not found', async () => {
      r.findById.mockResolvedValue(null);
      await expect(ticketsService.getOne(1)).rejects.toMatchObject({ status: 404 });
    });
    it('returns ticket merged with activity', async () => {
      r.findById.mockResolvedValue({ id: 1, subject: 'S' });
      r.findActivity.mockResolvedValue([{ id: 99 }]);
      expect(await ticketsService.getOne(1)).toEqual({ id: 1, subject: 'S', activity: [{ id: 99 }] });
    });
  });

  describe('create', () => {
    it('creates ticket and logs initial status_change', async () => {
      r.create.mockResolvedValue(7);
      r.addActivity.mockResolvedValue(undefined);
      const id = await ticketsService.create({ subject: 'S', created_by: 1 });
      expect(id).toBe(7);
      expect(r.addActivity).toHaveBeenCalledWith({ ticketId: 7, userId: 1, type: 'status_change', newValue: 'NEW' });
    });
  });

  describe('update', () => {
    it('throws 404 if ticket not found', async () => {
      r.findRaw.mockResolvedValue(null);
      await expect(ticketsService.update(1, { status: 'NEW' })).rejects.toMatchObject({ status: 404 });
    });

    it('logs only the changed field (status), leaves others untouched', async () => {
      r.findRaw.mockResolvedValue({
        status: 'NEW',
        priority: 'NORMAL',
        subject: 'S',
        ticket_type: 'Task',
        assignee_id: null,
        project_id: 1,
        body: 'B',
      });
      r.update.mockResolvedValue(undefined);
      r.addActivity.mockResolvedValue(undefined);

      await ticketsService.update(1, { status: 'IN_PROGRESS', user_id: 1 });

      expect(r.update).toHaveBeenCalledOnce();
      expect(r.addActivity).toHaveBeenCalledTimes(1);
      expect(r.addActivity).toHaveBeenCalledWith({
        ticketId: 1,
        userId: 1,
        type: 'status_change',
        oldValue: 'NEW',
        newValue: 'IN_PROGRESS',
      });
    });
  });
});
