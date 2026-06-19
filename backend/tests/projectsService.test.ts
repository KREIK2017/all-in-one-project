import { describe, it, expect, vi, beforeEach } from 'vitest';
import projectsService from '../services/projectsService';
import repo from '../repositories/projectsRepository';

vi.mock('../repositories/projectsRepository', () => ({
  default: { findActive: vi.fn(), create: vi.fn(), deleteWithTickets: vi.fn() },
}));

const r = repo as any;

describe('projectsService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('list delegates to repo.findActive', async () => {
    r.findActive.mockResolvedValue([{ id: 1 }]);
    expect(await projectsService.list()).toEqual([{ id: 1 }]);
    expect(r.findActive).toHaveBeenCalledOnce();
  });

  it('create throws 400 on empty name', async () => {
    await expect(projectsService.create({ name: '   ' } as any)).rejects.toMatchObject({ status: 400 });
    expect(r.create).not.toHaveBeenCalled();
  });

  it('create inserts and returns shaped object', async () => {
    r.create.mockResolvedValue(42);
    const res = await projectsService.create({ name: 'X', client_name: 'C', color: '#fff' });
    expect(r.create).toHaveBeenCalledWith({ name: 'X', client_name: 'C', color: '#fff' });
    expect(res).toEqual({ id: 42, name: 'X', client_name: 'C', color: '#fff' });
  });

  it('remove delegates to deleteWithTickets', async () => {
    r.deleteWithTickets.mockResolvedValue(undefined);
    await projectsService.remove(5);
    expect(r.deleteWithTickets).toHaveBeenCalledWith(5);
  });
});
