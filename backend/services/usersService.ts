import bcrypt from 'bcryptjs';
import repo from '../repositories/usersRepository';
import AppError from '../utils/AppError';
import { baseUrl } from '../config/env';

interface Actor {
  id: number;
  role: string;
}

interface ProfileUpdate {
  handle?: string;
  name?: string;
  email?: string;
  avatar_color?: string;
  theme?: string;
  font?: string;
}

export default {
  list() {
    return repo.findAll();
  },

  changeRole(actor: Actor, targetId: number | string, role: string) {
    if (actor.role !== 'admin') throw new AppError(403, 'Доступ заборонено');
    return repo.updateRole(targetId, role).then(() => ({ role }));
  },

  async updateProfile(userId: number, data: ProfileUpdate) {
    const { handle, name, email, avatar_color, theme, font } = data;

    if (handle && (await repo.handleTakenByOther(handle, userId))) {
      throw new AppError(400, 'This User ID is already taken');
    }
    if (email && (await repo.emailTakenByOther(email, userId))) {
      throw new AppError(400, 'This Email is already taken');
    }

    const current = await repo.getProfileFields(userId);

    let finalName = name && name.trim() !== '' ? name : current.name;
    if (!finalName || finalName.trim() === '') finalName = current.email.split('@')[0];

    const profile = {
      name: finalName,
      email: email || current.email,
      avatar_color: avatar_color || current.avatar_color,
      handle: handle !== undefined ? handle || null : current.handle,
      theme: theme || current.theme || 'dark',
      font: font || current.font || 'Inter',
    };
    await repo.updateProfile(userId, profile);
    return { id: userId, ...profile };
  },

  async isHandleAvailable(handle: string) {
    return { available: !(await repo.handleExists(handle)) };
  },

  async getProfileWithStats(id: number | string) {
    const user = await repo.findPublicProfile(id);
    if (!user) throw new AppError(404, 'User not found');
    const s = await repo.getUserStats(id);
    return { ...user, stats: { tickets: s.tickets, projects: s.projects, totalHours: (s.minutes / 60).toFixed(1) } };
  },

  async changePassword(userId: number, { oldPassword, newPassword }: { oldPassword: string; newPassword: string }) {
    const hash = await repo.getPasswordHash(userId);
    if (!hash) throw new AppError(404, 'Користувача не знайдено');
    const ok = await bcrypt.compare(oldPassword, hash);
    if (!ok) throw new AppError(400, 'Поточний пароль невірний');
    await repo.updatePassword(userId, await bcrypt.hash(newPassword, 10));
  },

  updateStatus(userId: number, status: string) {
    return repo.updateStatus(userId, status);
  },

  setAvatar(userId: number, filename: string) {
    const url = `${baseUrl}/uploads/avatars/${filename}`;
    return repo.updateAvatar(userId, url).then(() => url);
  },

  removeAvatar(userId: number) {
    return repo.updateAvatar(userId, null);
  },

  async remove(targetId: number | string, actor: Actor) {
    if (actor.role !== 'admin') {
      throw new AppError(403, 'Доступ заборонено');
    }
    if (actor.id === Number(targetId)) {
      throw new AppError(400, 'Не можна видалити самого себе');
    }

    const user = await repo.findById(targetId);
    if (!user) {
      throw new AppError(404, 'Користувача не знайдено');
    }

    await repo.deleteWithDependents(targetId);
  },
};
