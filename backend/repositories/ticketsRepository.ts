import { QueryTypes, Transaction } from 'sequelize';
import sequelize from '../config/sequelize';
import { Ticket, Activity, TimeEntry, Notification } from '../models';

interface TicketInput {
  project_id?: number | null;
  subject: string;
  body?: string | null;
  status?: string;
  priority?: string;
  ticket_type?: string;
  created_by: number;
  assignee_id?: number | null;
  is_private?: boolean | number;
}

interface TicketUpdate {
  status: string | null;
  priority: string | null;
  assignee_id: number | string | null;
  subject: string | null;
  body: string | null;
  project_id: number | string | null;
  ticket_type: string | null;
}

interface ActivityInput {
  ticketId: number | string;
  userId: number;
  type: string;
  content?: string | null;
  oldValue?: string | number | null;
  newValue?: string | number | null;
}

// Спільний SELECT з усіма JOIN — точна форма відповіді (плоскі поля)
const SELECT_WITH_JOINS = `
  SELECT t.*, p.name AS project_name,
         u.name AS assignee_name, u.avatar_url AS assignee_avatar_url,
         u.avatar_color AS assignee_avatar_color, u.status AS assignee_status
  FROM tickets t
  LEFT JOIN projects p ON t.project_id = p.id
  LEFT JOIN users u ON t.assignee_id = u.id
`;

export default {
  // Список з фільтрами (роль 'user' бачить лише свої; опційно по проєкту)
  findAll({ userId, role, projectId }: { userId: number; role: string; projectId?: number | string }) {
    const conditions: string[] = [];
    const replacements: any[] = [];
    if (role === 'user') {
      conditions.push('(t.created_by = ? OR t.assignee_id = ?)');
      replacements.push(userId, userId);
    }
    if (projectId) {
      conditions.push('t.project_id = ?');
      replacements.push(projectId);
    }
    let sql = SELECT_WITH_JOINS;
    if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')} `;
    sql += ' ORDER BY t.updated_at DESC';
    return sequelize.query(sql, { replacements, type: QueryTypes.SELECT });
  },

  async findById(id: number | string) {
    const rows = (await sequelize.query(`${SELECT_WITH_JOINS} WHERE t.id = ?`, {
      replacements: [id],
      type: QueryTypes.SELECT,
    })) as any[];
    return rows[0];
  },

  // "Сирий" тікет без JOIN
  findRaw(id: number | string) {
    return Ticket.findByPk(id, { raw: true }) as any;
  },

  // Стрічка активності тікета
  findActivity(ticketId: number | string) {
    return sequelize.query(
      `
      SELECT a.*, u.name AS author_name, u.avatar_url AS author_avatar_url, u.avatar_color AS author_avatar_color
      FROM activity a
      JOIN users u ON a.user_id = u.id
      WHERE a.ticket_id = ?
      ORDER BY a.created_at ASC
    `,
      { replacements: [ticketId], type: QueryTypes.SELECT }
    );
  },

  async create(t: TicketInput) {
    const created = await Ticket.create({
      project_id: t.project_id || null,
      subject: t.subject,
      body: t.body || null,
      status: t.status || 'NEW',
      priority: t.priority || 'NORMAL',
      ticket_type: t.ticket_type || 'Task',
      created_by: t.created_by,
      assignee_id: t.assignee_id || null,
      is_private: t.is_private ? 1 : 0,
    });
    return created.get('id') as number;
  },

  // Реплікація COALESCE: null-поля (відсутні) НЕ чіпаємо; assignee_id/project_id можна обнулити
  update(id: number | string, f: TicketUpdate) {
    const payload: any = { assignee_id: f.assignee_id, project_id: f.project_id };
    if (f.status !== null) payload.status = f.status;
    if (f.priority !== null) payload.priority = f.priority;
    if (f.subject !== null) payload.subject = f.subject;
    if (f.body !== null) payload.body = f.body;
    if (f.ticket_type !== null) payload.ticket_type = f.ticket_type;
    return Ticket.update(payload, { where: { id } });
  },

  touch(id: number | string) {
    return Ticket.update({ updated_at: sequelize.fn('NOW') } as any, { where: { id } });
  },

  // ОДИН універсальний метод; transaction — необов'язкова транзакція Sequelize
  addActivity(
    { ticketId, userId, type, content = null, oldValue = null, newValue = null }: ActivityInput,
    transaction?: Transaction
  ) {
    return Activity.create(
      { ticket_id: ticketId, user_id: userId, type, content, old_value: oldValue, new_value: newValue },
      { transaction }
    );
  },

  // Видалення тікета РАЗОМ із його записами часу — у транзакції.
  // activity видаляється каскадом (FK ON DELETE CASCADE).
  deleteWithEntries(id: number | string) {
    return sequelize.transaction(async (t) => {
      await TimeEntry.destroy({ where: { ticket_id: id }, transaction: t });
      await Notification.destroy({ where: { target_id: id }, transaction: t });
      await Ticket.destroy({ where: { id }, transaction: t });
    });
  },
};
