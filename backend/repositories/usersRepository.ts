import { Op } from 'sequelize';
import sequelize from '../config/sequelize';
import { User, Ticket, TimeEntry, Activity, Notification } from '../models';

interface ProfileFields {
  name: string;
  email: string;
  avatar_color: string;
  handle: string | null;
  theme: string;
  font: string;
}

export default {
  // --- читання ---
  findAll() {
    return User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'handle', 'avatar_color', 'avatar_url', 'status', 'created_at'],
      order: [['name', 'ASC']],
      raw: true,
    }) as any;
  },

  findById(id: number | string) {
    return User.findByPk(id, { raw: true }) as any;
  },

  findByMention(username: string) {
    return User.findOne({
      where: { [Op.or]: [{ name: username }, { email: { [Op.like]: `${username}%` } }] },
      attributes: ['id', 'email', 'name'],
      raw: true,
    }) as any;
  },

  findByEmail(email: string) {
    return User.findOne({ where: { email }, raw: true }) as any;
  },

  async createUser({ name, email, passwordHash }: { name: string; email: string; passwordHash: string }) {
    const u = await User.create({ name, email, password_hash: passwordHash });
    return u.get('id') as number;
  },

  findProfileById(id: number) {
    return User.findByPk(id, {
      attributes: ['id', 'name', 'email', 'role', 'handle', 'avatar_color', 'avatar_url', 'theme', 'font'],
      raw: true,
    }) as any;
  },

  // --- зміни ---
  updateRole(id: number | string, role: string) {
    return User.update({ role }, { where: { id } });
  },

  getProfileFields(id: number) {
    return User.findByPk(id, {
      attributes: ['name', 'email', 'avatar_color', 'handle', 'theme', 'font'],
      raw: true,
    }) as any;
  },

  updateProfile(id: number, p: ProfileFields) {
    return User.update(p, { where: { id } });
  },

  updateAvatar(id: number, url: string | null) {
    return User.update({ avatar_url: url }, { where: { id } });
  },

  async handleTakenByOther(handle: string, excludeId: number) {
    return (await User.count({ where: { handle, id: { [Op.ne]: excludeId } } })) > 0;
  },

  async emailTakenByOther(email: string, excludeId: number) {
    return (await User.count({ where: { email, id: { [Op.ne]: excludeId } } })) > 0;
  },

  async handleExists(handle: string) {
    return (await User.count({ where: { handle } })) > 0;
  },

  // --- публічний профіль + статистика ---
  findPublicProfile(id: number | string) {
    return User.findByPk(id, {
      attributes: ['id', 'name', 'email', 'handle', 'avatar_color', 'avatar_url', 'created_at'],
      raw: true,
    }) as any;
  },

  async getUserStats(id: number | string) {
    const tickets = await Ticket.count({ where: { assignee_id: id } });
    const projects = await TimeEntry.count({ where: { user_id: id }, distinct: true, col: 'project_id' });
    const minutes = (await TimeEntry.sum('duration_minutes', { where: { user_id: id } })) || 0;
    return { tickets, projects, minutes };
  },

  // --- пароль / статус ---
  async getPasswordHash(id: number) {
    const u = (await User.findByPk(id, { attributes: ['password_hash'], raw: true })) as any;
    return u?.password_hash as string | undefined;
  },

  updatePassword(id: number, passwordHash: string) {
    return User.update({ password_hash: passwordHash }, { where: { id } });
  },

  updateStatus(id: number, status: string) {
    return User.update({ status }, { where: { id } });
  },

  // Видалення разом із залежностями — в ОДНІЙ транзакції (це і лагодить FK-помилку)
  deleteWithDependents(id: number | string) {
    return sequelize.transaction(async (t) => {
      await Activity.destroy({ where: { user_id: id }, transaction: t });
      await TimeEntry.destroy({ where: { user_id: id }, transaction: t });
      await Notification.destroy({ where: { [Op.or]: [{ user_id: id }, { actor_id: id }] }, transaction: t });
      await Ticket.destroy({ where: { created_by: id }, transaction: t });
      await User.destroy({ where: { id }, transaction: t });
    });
  },
};
