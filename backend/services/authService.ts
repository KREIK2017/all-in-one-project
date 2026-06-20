import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import usersRepo from '../repositories/usersRepository';
import AppError from '../utils/AppError';
import { jwtSecret } from '../config/env';

function signToken(id: number) {
  return jwt.sign({ id }, jwtSecret, { expiresIn: '30d' });
}

// Єдине місце, що формує "публічного" юзера для відповіді (без password_hash)
function publicUser(u: Record<string, any>) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role || 'user',
    handle: u.handle ?? null,
    avatar_color: u.avatar_color ?? '#3e8488ff',
    avatar_url: u.avatar_url ?? null,
    theme: u.theme || 'dark',
    font: u.font || 'Inter',
    status: u.status || 'online',
  };
}

export default {
  async register({ name, email, password }: { name: string; email: string; password: string }) {
    const existing = await usersRepo.findByEmail(email);
    if (existing) throw new AppError(400, 'Користувач з таким email вже існує');

    const passwordHash = await bcrypt.hash(password, 10);
    const id = await usersRepo.createUser({ name, email, passwordHash });
    return { token: signToken(id), user: publicUser({ id, name, email }) };
  },

  async login({ email, password }: { email: string; password: string }) {
    const user = await usersRepo.findByEmail(email);
    if (!user) throw new AppError(400, 'Невірний email або пароль');

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new AppError(400, 'Невірний email або пароль');

    // Presence: при вході — online
    await usersRepo.updateStatus(user.id, 'online');
    user.status = 'online';

    return { token: signToken(user.id), user: publicUser(user) };
  },

  // Presence: при виході — offline
  async logout(userId: number) {
    await usersRepo.updateStatus(userId, 'offline');
  },

  async me(token?: string) {
    if (!token) throw new AppError(401, 'Токен відсутній');
    let decoded: { id: number };
    try {
      decoded = jwt.verify(token, jwtSecret) as { id: number };
    } catch {
      throw new AppError(401, 'Невірний токен');
    }
    const user = await usersRepo.findProfileById(decoded.id);
    if (!user) throw new AppError(404, 'Користувача не знайдено');
    return user;
  },
};
