import sequelize from '../config/sequelize';
import { Project, Ticket, Notification } from '../models';

export default {
  findActive() {
    return Project.findAll({ where: { is_active: 1 }, order: [['name', 'ASC']], raw: true }) as any;
  },

  async create({ name, client_name, color }: { name: string; client_name?: string | null; color?: string }) {
    const p = await Project.create({ name, client_name: client_name || null, color: color || '#00f2fe' });
    return p.get('id') as number;
  },

  // М'яке видалення: проєкт ховається, але дані (тікети/час) лишаються
  softDelete(id: number | string) {
    return Project.update({ is_active: 0 }, { where: { id } });
  },

  // Сховати проєкт + видалити його тікети (білінг/час зберігаємо) — у транзакції.
  deleteWithTickets(id: number | string) {
    return sequelize.transaction(async (t) => {
      const tickets = (await Ticket.findAll({
        where: { project_id: id },
        attributes: ['id'],
        raw: true,
        transaction: t,
      })) as any[];
      const ids = tickets.map((row) => row.id);
      if (ids.length) {
        await Notification.destroy({ where: { target_id: ids }, transaction: t });
        // тікети: activity видаляється каскадом; time_entries.ticket_id -> SET NULL (час лишається)
        await Ticket.destroy({ where: { id: ids }, transaction: t });
      }
      // проєкт ховаємо (time_entries.project_id лишається -> білінг у Reports зберігається)
      await Project.update({ is_active: 0 }, { where: { id }, transaction: t });
    });
  },
};
