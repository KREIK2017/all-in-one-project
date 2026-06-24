import { QueryTypes, Transaction } from 'sequelize';
import sequelize from '../config/sequelize';
import { Ticket, Activity, TimeEntry, Notification, TicketAssignee } from '../models';

interface TicketInput {
  project_id?: number | null;
  subject: string;
  body?: string | null;
  status?: string;
  priority?: string;
  ticket_type?: string;
  created_by: number;
  is_private?: boolean | number;
}

interface TicketUpdate {
  status: string | null;
  priority: string | null;
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

// Дотягуємо список виконавців (з junction) до кожного тікета у відповіді
async function attachAssignees(tickets: any[]) {
  if (!tickets.length) return tickets;
  const ids = tickets.map((t) => t.id);
  const rows = (await sequelize.query(
    `SELECT ta.ticket_id, u.id, u.name, u.avatar_url, u.avatar_color, u.status
     FROM ticket_assignees ta JOIN users u ON ta.user_id = u.id
     WHERE ta.ticket_id IN (?)`,
    { replacements: [ids], type: QueryTypes.SELECT }
  )) as any[];
  const byTicket: Record<number, any[]> = {};
  for (const r of rows) {
    if (!byTicket[r.ticket_id]) byTicket[r.ticket_id] = [];
    byTicket[r.ticket_id].push({ id: r.id, name: r.name, avatar_url: r.avatar_url, avatar_color: r.avatar_color, status: r.status });
  }
  return tickets.map((t) => ({ ...t, assignees: byTicket[t.id] || [] }));
}

export default {
  // Список з фільтрами (роль 'user' бачить лише свої — створені або призначені; опційно по проєкту)
  async findAll({ userId, role, projectId }: { userId: number; role: string; projectId?: number | string }) {
    const conditions: string[] = [];
    const replacements: any[] = [];
    if (role === 'user') {
      conditions.push('(t.created_by = ? OR t.id IN (SELECT ticket_id FROM ticket_assignees WHERE user_id = ?))');
      replacements.push(userId, userId);
    }
    if (projectId) {
      conditions.push('t.project_id = ?');
      replacements.push(projectId);
    }
    let sql = 'SELECT t.*, p.name AS project_name FROM tickets t LEFT JOIN projects p ON t.project_id = p.id';
    if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')} `;
    sql += ' ORDER BY t.updated_at DESC';
    const tickets = (await sequelize.query(sql, { replacements, type: QueryTypes.SELECT })) as any[];
    return attachAssignees(tickets);
  },

  async findById(id: number | string) {
    const rows = (await sequelize.query(
      'SELECT t.*, p.name AS project_name FROM tickets t LEFT JOIN projects p ON t.project_id = p.id WHERE t.id = ?',
      { replacements: [id], type: QueryTypes.SELECT }
    )) as any[];
    if (!rows[0]) return undefined;
    const [withA] = await attachAssignees([rows[0]]);
    return withA;
  },

  // "Сирий" тікет без JOIN
  findRaw(id: number | string) {
    return Ticket.findByPk(id, { raw: true }) as any;
  },

  // --- виконавці (junction) ---
  getAssigneeIds(ticketId: number | string): Promise<number[]> {
    return sequelize
      .query('SELECT user_id FROM ticket_assignees WHERE ticket_id = ?', { replacements: [ticketId], type: QueryTypes.SELECT })
      .then((rows: any[]) => rows.map((r) => r.user_id as number));
  },

  // Перезаписати список виконавців тікета
  async setAssignees(ticketId: number | string, userIds: number[], transaction?: Transaction) {
    await TicketAssignee.destroy({ where: { ticket_id: ticketId }, transaction });
    if (userIds.length) {
      await TicketAssignee.bulkCreate(
        userIds.map((uid) => ({ ticket_id: ticketId, user_id: uid })),
        { transaction }
      );
    }
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
      is_private: t.is_private ? 1 : 0,
    });
    return created.get('id') as number;
  },

  // COALESCE: null-поля (відсутні) НЕ чіпаємо; project_id можна обнулити. Виконавці — окремо (junction).
  update(id: number | string, f: TicketUpdate) {
    const payload: any = { project_id: f.project_id };
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
  // activity і ticket_assignees видаляються каскадом (FK ON DELETE CASCADE).
  deleteWithEntries(id: number | string) {
    return sequelize.transaction(async (t) => {
      await TimeEntry.destroy({ where: { ticket_id: id }, transaction: t });
      await Notification.destroy({ where: { target_id: id }, transaction: t });
      await Ticket.destroy({ where: { id }, transaction: t });
    });
  },
};
