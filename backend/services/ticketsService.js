const repo = require('../repositories/ticketsRepository');
const usersRepo = require('../repositories/usersRepository');
const notifications = require('./notificationsService');
const AppError = require('../utils/AppError');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

module.exports = {
  list({ user, projectId }) {
    return repo.findAll({ userId: user.id, role: user.role, projectId });
  },

  async getOne(id) {
    const ticket = await repo.findById(id);
    if (!ticket) throw new AppError(404, 'Ticket not found');
    const activity = await repo.findActivity(id);
    return { ...ticket, activity };
  },

  async create(data) {
    const id = await repo.create(data);
    await repo.addActivity({ ticketId: id, userId: data.created_by, type: 'status_change', newValue: 'NEW' });
    return id;
  },

  async addComment(ticketId, { userId, content }) {
    await repo.addActivity({ ticketId, userId, type: 'comment', content });
    await repo.touch(ticketId);
    await this._handleMentions(ticketId, userId, content);
  },

  async update(id, data) {
    const current = await repo.findRaw(id);
    if (!current) throw new AppError(404, 'Not found');

    // assignee_id / project_id йдуть БЕЗ COALESCE (їх можна обнулити),
    // тому undefined/'' приводимо до null, щоб mysql2 не впав і щоб "зняти" значення:
    const fields = {
      status: data.status ?? null,
      priority: data.priority ?? null,
      assignee_id: (data.assignee_id === '' || data.assignee_id === undefined) ? null : data.assignee_id,
      subject: data.subject ?? null,
      body: data.body ?? null,
      project_id: (data.project_id === '' || data.project_id === undefined) ? null : data.project_id,
      ticket_type: data.ticket_type ?? null,
    };
    await repo.update(id, fields);

    const userId = data.user_id;
    const changes = [];
    if (data.status && data.status !== current.status) changes.push({ type: 'status_change', old: current.status, new: data.status });
    if (data.priority && data.priority !== current.priority) changes.push({ type: 'priority_change', old: current.priority, new: data.priority });
    if (data.assignee_id !== undefined && (fields.assignee_id || 0) !== (current.assignee_id || 0)) {
      changes.push({ type: 'reassign', old: current.assignee_id, new: fields.assignee_id });
    }
    if (data.subject && data.subject !== current.subject) changes.push({ type: 'subject_change', old: current.subject, new: data.subject });
    if (data.ticket_type && data.ticket_type !== current.ticket_type) changes.push({ type: 'type_change', old: current.ticket_type, new: data.ticket_type });

    for (const c of changes) {
      await repo.addActivity({ ticketId: id, userId, type: c.type, oldValue: c.old, newValue: c.new });
      if (c.type === 'reassign' && c.new && Number(c.new) !== Number(userId || 0)) {
        await this._notifyAssignment(id, userId, c.new);
      }
    }

    // Зміна body/проєкту — простий запис "оновлено"
    if ((data.body !== undefined && data.body !== current.body) ||
        (data.project_id !== undefined && fields.project_id !== current.project_id)) {
      await repo.addActivity({ ticketId: id, userId, type: 'ticket_updated' });
    }
  },

  // --- приватні помічники (підкреслення _ = "не для зовнішнього виклику") ---

  async _handleMentions(ticketId, userId, content) {
    const mentions = [...content.matchAll(/@(\w+)/g)].map(m => m[1]);
    if (!mentions.length) return;
    const ticket = await repo.findRaw(ticketId);
    const actor = await usersRepo.findById(userId);
    if (!ticket || !actor) return;

    for (const username of mentions) {
      const target = await usersRepo.findByMention(username);
      if (!target || target.id === Number(userId)) continue;
      const message = `${actor.name} mentioned you in ticket: ${ticket.subject}`;
      await notifications.notify({
        recipient: target, actorId: userId, type: 'mention', targetId: ticketId, message,
        emailSubject: `You were mentioned in "${ticket.subject}"`,
        emailHtml: `<p><strong>${actor.name}</strong> mentioned you in a comment on ticket <strong>"${ticket.subject}"</strong>:</p><blockquote style="border-left:4px solid #eee;padding-left:10px;color:#666;">${content}</blockquote><p><a href="${FRONTEND_URL}/tickets/${ticketId}">View Ticket</a></p>`,
      });
    }
  },

  async _notifyAssignment(ticketId, actorId, targetId) {
    const target = await usersRepo.findById(targetId);
    const actor = await usersRepo.findById(actorId);
    const ticket = await repo.findRaw(ticketId);
    if (!target || !actor || !ticket) return;
    const message = `${actor.name} assigned a ticket to you: ${ticket.subject}`;
    await notifications.notify({
      recipient: target, actorId, type: 'assignment', targetId: ticketId, message,
      emailSubject: `New Ticket Assigned: ${ticket.subject}`,
      emailHtml: `<p><strong>${actor.name}</strong> assigned you to the ticket: <strong>"${ticket.subject}"</strong>.</p><p><a href="${FRONTEND_URL}/tickets/${ticketId}">View Ticket</a></p>`,
    });
  },
};
