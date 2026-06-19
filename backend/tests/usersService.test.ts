import { describe, it, expect, vi, beforeEach } from 'vitest';
import usersService from '../services/usersService';
import repo from '../repositories/usersRepository';
import bcrypt from 'bcryptjs';

vi.mock('../repositories/usersRepository', () => ({
  default: {
    findAll: vi.fn(),
    updateRole: vi.fn(),
    handleTakenByOther: vi.fn(),
    emailTakenByOther: vi.fn(),
    getProfileFields: vi.fn(),
    updateProfile: vi.fn(),
    handleExists: vi.fn(),
    findById: vi.fn(),
    deleteWithDependents: vi.fn(),
    getPasswordHash: vi.fn(),
    updatePassword: vi.fn(),
  },
}));
vi.mock('bcryptjs', () => ({ default: { compare: vi.fn(), hash: vi.fn() } }));

const r = repo as any;
const b = bcrypt as any;
const getErr = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return e as any;
  }
};

describe('usersService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('changeRole', () => {
    it('throws 403 if actor is not admin', () => {
      expect(getErr(() => usersService.changeRole({ id: 1, role: 'user' }, 2, 'admin')).status).toBe(403);
      expect(r.updateRole).not.toHaveBeenCalled();
    });
    it('updates role when admin', async () => {
      r.updateRole.mockResolvedValue(undefined);
      const res = await usersService.changeRole({ id: 1, role: 'admin' }, 2, 'user');
      expect(r.updateRole).toHaveBeenCalledWith(2, 'user');
      expect(res).toEqual({ role: 'user' });
    });
  });

  describe('remove', () => {
    it('throws 403 if not admin', async () => {
      await expect(usersService.remove(2, { id: 1, role: 'user' })).rejects.toMatchObject({ status: 403 });
    });
    it('throws 400 when deleting self', async () => {
      await expect(usersService.remove(1, { id: 1, role: 'admin' })).rejects.toMatchObject({ status: 400 });
    });
    it('throws 404 if target not found', async () => {
      r.findById.mockResolvedValue(null);
      await expect(usersService.remove(2, { id: 1, role: 'admin' })).rejects.toMatchObject({ status: 404 });
    });
    it('deletes with dependents on success', async () => {
      r.findById.mockResolvedValue({ id: 2 });
      r.deleteWithDependents.mockResolvedValue(undefined);
      await usersService.remove(2, { id: 1, role: 'admin' });
      expect(r.deleteWithDependents).toHaveBeenCalledWith(2);
    });
  });

  describe('updateProfile', () => {
    it('throws 400 if handle taken by another', async () => {
      r.handleTakenByOther.mockResolvedValue(true);
      await expect(usersService.updateProfile(1, { handle: 'taken' })).rejects.toMatchObject({ status: 400 });
    });
    it('falls back to current name when empty, and saves', async () => {
      r.handleTakenByOther.mockResolvedValue(false);
      r.emailTakenByOther.mockResolvedValue(false);
      r.getProfileFields.mockResolvedValue({
        name: 'Old',
        email: 'a@b.com',
        avatar_color: '#111',
        handle: 'h',
        theme: 'dark',
        font: 'Inter',
      });
      r.updateProfile.mockResolvedValue(undefined);
      const res = await usersService.updateProfile(1, { name: '   ' });
      expect(r.updateProfile).toHaveBeenCalledOnce();
      expect(res.name).toBe('Old'); // порожнє ім'я -> лишається поточне
    });
  });

  describe('changePassword', () => {
    it('throws 400 if old password is wrong', async () => {
      r.getPasswordHash.mockResolvedValue('hash');
      b.compare.mockResolvedValue(false);
      await expect(
        usersService.changePassword(1, { oldPassword: 'wrong', newPassword: 'new' })
      ).rejects.toMatchObject({ status: 400 });
      expect(r.updatePassword).not.toHaveBeenCalled();
    });
    it('updates password when old is correct', async () => {
      r.getPasswordHash.mockResolvedValue('hash');
      b.compare.mockResolvedValue(true);
      b.hash.mockResolvedValue('newhash');
      await usersService.changePassword(1, { oldPassword: 'ok', newPassword: 'new' });
      expect(r.updatePassword).toHaveBeenCalledWith(1, 'newhash');
    });
  });

  describe('isHandleAvailable', () => {
    it('returns available=false when handle exists', async () => {
      r.handleExists.mockResolvedValue(true);
      expect(await usersService.isHandleAvailable('x')).toEqual({ available: false });
    });
  });
});
