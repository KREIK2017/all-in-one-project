import repo from '../repositories/ticketsRepository';
import usersRepo from '../repositories/usersRepository';
import notifications from './notificationsService';
import AppError from '../utils/AppError';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

interface CreateTicketData {
  project_id?: number | null;
  subject: string;
  body?: string | null;
  status?: string;
  priority?: string;
  ticket_type?: string;
  created_by: number;
  assignee_ids?: (number | string)[];
  is_private?: boolean | number;
}

interface UpdateTicketData {
  status?: string;
  priority?: string;
  assignee_ids?: (number | string)[];
  subject?: string;
  body?: string;
  project_id?: number | string | '';
  ticket_type?: string;
  user_id?: number;
}

// Унікальні додатні цілі id (з масиву рядків/чисел)
const uniqueIds = (arr?: (number | string)[]): number[] =>
  [...new Set((arr || []).map(Number).filter((n) => Number.isInteger(n) && n > 0))];

// --- приватні помічники (модульного рівня) ---

async function handleMentions(ticketId: number | string, userId: number, content: string) {
  const mentions = [...content.matchAll(/@(\w+)/g)].map((m) => m[1]);
  if (!mentions.length) return;
  const ticket = await repo.findRaw(ticketId);
  const actor = await usersRepo.findById(userId);
  if (!ticket || !actor) return;

  for (const username of mentions) {
    const target = await usersRepo.findByMention(username);
    if (!target || target.id === Number(userId)) continue;
    const message = `${actor.name} mentioned you in ticket: ${ticket.subject}`;
    await notifications.notify({
      recipient: { id: target.id, email: target.email },
      actorId: userId,
      type: 'mention',
      targetId: ticketId,
      message,
      emailSubject: `You were mentioned in "${ticket.subject}"`,
      emailHtml: `<p><strong>${actor.name}</strong> mentioned you in a comment on ticket <strong>"${ticket.subject}"</strong>:</p><blockquote style="border-left:4px solid #eee;padding-left:10px;color:#666;">${content}</blockquote><p><a href="${FRONTEND_URL}/tickets/${ticketId}">View Ticket</a></p>`,
    });
  }
}

async function notifyAssignment(ticketId: number | string, actorId: number, targetId: number | string) {
  const target = await usersRepo.findById(targetId);
  const actor = await usersRepo.findById(actorId);
  const ticket = await repo.findRaw(ticketId);
  if (!target || !actor || !ticket) return;
  const message = `${actor.name} assigned a ticket to you: ${ticket.subject}`;
  await notifications.notify({
    recipient: { id: target.id, email: target.email },
    actorId,
    type: 'assignment',
    targetId: ticketId,
    message,
    emailSubject: `New Ticket Assigned: ${ticket.subject}`,
    emailHtml: `<p><strong>${actor.name}</strong> assigned you to the ticket: <strong>"${ticket.subject}"</strong>.</p><p><a href="${FRONTEND_URL}/tickets/${ticketId}">View Ticket</a></p>`,
  });
}

export default {
  list({ user, projectId }: { user: { id: number; role: string }; projectId?: number | string }) {
    return repo.findAll({ userId: user.id, role: user.role, projectId });
  },

  async getOne(id: number | string) {
    const ticket = await repo.findById(id);
    if (!ticket) throw new AppError(404, 'Ticket not found');
    const activity = await repo.findActivity(id);
    return { ...ticket, activity };
  },

  async create(data: CreateTicketData) {
    const id = await repo.create(data);
    const assigneeIds = uniqueIds(data.assignee_ids);
    await repo.setAssignees(id, assigneeIds);
    await repo.addActivity({ ticketId: id, userId: data.created_by, type: 'status_change', newValue: 'NEW' });
    // сповістити призначених (окрім автора)
    for (const uid of assigneeIds) {
      if (uid !== data.created_by) await notifyAssignment(id, data.created_by, uid);
    }
    return id;
  },

  async addComment(ticketId: number | string, { userId, content }: { userId: number; content: string }) {
    await repo.addActivity({ ticketId, userId, type: 'comment', content });
    await repo.touch(ticketId);
    await handleMentions(ticketId, userId, content);
  },

  async remove(id: number | string) {
    const ticket = await repo.findRaw(id);
    if (!ticket) throw new AppError(404, 'Ticket not found');
    await repo.deleteWithEntries(id);
  },

  async update(id: number | string, data: UpdateTicketData) {
    const current = await repo.findRaw(id);
    if (!current) throw new AppError(404, 'Not found');

    // undefined = поле не передали -> лишаємо поточне; '' = явно «зняти» -> null (для project_id)
    const fields = {
      status: data.status ?? null,
      priority: data.priority ?? null,
      subject: data.subject ?? null,
      body: data.body ?? null,
      project_id: data.project_id === undefined ? current.project_id : data.project_id === '' ? null : data.project_id,
      ticket_type: data.ticket_type ?? null,
    };
    await repo.update(id, fields);

    const userId = data.user_id as number;
    const changes: { type: string; old: any; new: any }[] = [];
    if (data.status && data.status !== current.status) changes.push({ type: 'status_change', old: current.status, new: data.status });
    if (data.priority && data.priority !== current.priority) changes.push({ type: 'priority_change', old: current.priority, new: data.priority });
    if (data.subject && data.subject !== current.subject) changes.push({ type: 'subject_change', old: current.subject, new: data.subject });
    if (data.ticket_type && data.ticket_type !== current.ticket_type) changes.push({ type: 'type_change', old: current.ticket_type, new: data.ticket_type });
    for (const c of changes) {
      await repo.addActivity({ ticketId: id, userId, type: c.type, oldValue: c.old, newValue: c.new });
    }

    // Виконавці (junction): обчислюємо доданих/прибраних
    if (data.assignee_ids !== undefined) {
      const newIds = uniqueIds(data.assignee_ids);
      const currentIds = await repo.getAssigneeIds(id);
      const added = newIds.filter((x) => !currentIds.includes(x));
      const removed = currentIds.filter((x) => !newIds.includes(x));
      if (added.length || removed.length) {
        await repo.setAssignees(id, newIds);
        for (const uid of added) {
          await repo.addActivity({ ticketId: id, userId, type: 'reassign', newValue: uid });
          if (uid !== Number(userId)) await notifyAssignment(id, userId, uid);
        }
        for (const uid of removed) {
          await repo.addActivity({ ticketId: id, userId, type: 'reassign', oldValue: uid });
        }
      }
    }

    // Зміна body/проєкту — простий запис "оновлено"
    if (
      (data.body !== undefined && data.body !== current.body) ||
      (data.project_id !== undefined && fields.project_id !== current.project_id)
    ) {
      await repo.addActivity({ ticketId: id, userId, type: 'ticket_updated' });
    }
  },
};
