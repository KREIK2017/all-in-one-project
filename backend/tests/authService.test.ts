import { describe, it, expect, vi, beforeEach } from 'vitest';
import authService from '../services/authService';
import usersRepo from '../repositories/usersRepository';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

vi.mock('../repositories/usersRepository', () => ({
  default: { findByEmail: vi.fn(), createUser: vi.fn(), findProfileById: vi.fn(), updateStatus: vi.fn() },
}));
vi.mock('bcryptjs', () => ({ default: { hash: vi.fn(), compare: vi.fn() } }));
vi.mock('jsonwebtoken', () => ({ default: { sign: vi.fn(() => 'tok'), verify: vi.fn() } }));

const r = usersRepo as any;
const b = bcrypt as any;
const j = jwt as any;

describe('authService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('register', () => {
    it('throws 400 if email already exists', async () => {
      r.findByEmail.mockResolvedValue({ id: 1 });
      await expect(authService.register({ name: 'N', email: 'a@b.com', password: 'p' })).rejects.toMatchObject({
        status: 400,
      });
    });
    it('returns token + public user without password_hash', async () => {
      r.findByEmail.mockResolvedValue(null);
      b.hash.mockResolvedValue('h');
      r.createUser.mockResolvedValue(7);
      const res = await authService.register({ name: 'N', email: 'a@b.com', password: 'p' });
      expect(res.token).toBe('tok');
      expect(res.user.id).toBe(7);
      expect((res.user as any).password_hash).toBeUndefined();
    });
  });

  describe('login', () => {
    it('throws 400 if user not found', async () => {
      r.findByEmail.mockResolvedValue(null);
      await expect(authService.login({ email: 'x@y.com', password: 'p' })).rejects.toMatchObject({ status: 400 });
    });
    it('throws 400 on wrong password', async () => {
      r.findByEmail.mockResolvedValue({ id: 1, password_hash: 'h' });
      b.compare.mockResolvedValue(false);
      await expect(authService.login({ email: 'x@y.com', password: 'bad' })).rejects.toMatchObject({ status: 400 });
    });
    it('returns token and strips password_hash on success', async () => {
      r.findByEmail.mockResolvedValue({ id: 1, email: 'x@y.com', name: 'N', role: 'admin', password_hash: 'h' });
      b.compare.mockResolvedValue(true);
      const res = await authService.login({ email: 'x@y.com', password: 'ok' });
      expect(res.token).toBe('tok');
      expect((res.user as any).password_hash).toBeUndefined();
      expect(res.user.role).toBe('admin');
    });
  });

  describe('me', () => {
    it('throws 401 without token', async () => {
      await expect(authService.me(undefined)).rejects.toMatchObject({ status: 401 });
    });
    it('throws 401 on invalid token', async () => {
      j.verify.mockImplementation(() => {
        throw new Error('bad');
      });
      await expect(authService.me('bad')).rejects.toMatchObject({ status: 401 });
    });
    it('returns profile for valid token', async () => {
      j.verify.mockReturnValue({ id: 5 });
      r.findProfileById.mockResolvedValue({ id: 5, name: 'N' });
      expect(await authService.me('good')).toEqual({ id: 5, name: 'N' });
    });
  });
});
