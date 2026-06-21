import { getIO } from './socket';
import usersRepo from './repositories/usersRepository';
import { User, Ticket } from './models';
import timeService from './services/timeService';
import ticketsService from './services/ticketsService';
import AppError from './utils/AppError';

const TICK_MS = 15000; // як часто бот «працює»

let running = false;
let ticketId: number | null = null;
let botUserId: number | null = null;
let timer: NodeJS.Timeout | null = null;

const COMMENTS = [
  'Looking into this, will update soon.',
  'Pushed a small fix, testing now.',
  'Refactored part of the logic here.',
  'Synced with the latest changes.',
  'Added a few edge-case handlers.',
];
const STATUSES = ['NEW', 'IN_PROGRESS', 'COMPLETED'];

// Створює бот-користувача один раз (або знаходить наявного)
async function ensureBotUser(): Promise<number> {
  if (botUserId) return botUserId;
  const existing: any = await usersRepo.findByEmail('bot@aio.local');
  if (existing) {
    botUserId = existing.id;
  } else {
    botUserId = await usersRepo.createUser({ name: 'Worker Bot', email: 'bot@aio.local', passwordHash: 'x' });
    // бот за замовчуванням away (на паузі)
    await User.update({ handle: 'workerbot', avatar_color: '#22d3ee', status: 'away' }, { where: { id: botUserId } });
  }
  return botUserId as number;
}

// Створити бота при старті сервера, щоб його id був відомий фронту одразу
export async function initBot() {
  await ensureBotUser();
}

function emit(type: string, message: string) {
  getIO()?.emit('bot:activity', { type, ticketId, message, at: new Date() });
}

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Одна «дія» бота над призначеним тікетом
async function tick() {
  if (!running || !ticketId || !botUserId) return;
  try {
    const ticket: any = await Ticket.findByPk(ticketId, { raw: true });
    if (!ticket) return;
    const r = Math.random();

    if (ticket.project_id && r < 0.5) {
      // ── час (лише якщо тікет привʼязаний до проєкту) ──
      const mins = 5 + Math.floor(Math.random() * 20);
      await timeService.addManual({
        userId: botUserId,
        projectId: ticket.project_id,
        ticketId,
        durationMinutes: mins,
        description: 'Bot work session',
      });
      emit('time', `🤖 залогував ${mins} хв`);
    } else if (r < 0.8) {
      // ── коментар ──
      await ticketsService.addComment(ticketId, { userId: botUserId, content: pick(COMMENTS) });
      emit('comment', '🤖 додав коментар');
    } else {
      // ── зміна статусу ──
      const next = pick(STATUSES.filter((s) => s !== ticket.status));
      await ticketsService.update(ticketId, { status: next, user_id: botUserId });
      emit('status', `🤖 статус → ${next}`);
    }
  } catch (e) {
    console.error('[bot] tick error:', e);
  }
}

export async function startBot(tid: number) {
  await ensureBotUser();
  // Бот працює лише над тікетом, де він призначений виконавцем
  const ticket: any = await Ticket.findByPk(tid, { raw: true });
  if (!ticket) throw new AppError(404, 'Тікет не знайдено');
  if (Number(ticket.assignee_id) !== botUserId) {
    throw new AppError(400, 'Бот має бути призначений виконавцем (Assignee) цього тікета');
  }
  ticketId = tid;
  running = true;
  await usersRepo.updateStatus(botUserId!, 'online'); // працює -> online (live)
  getIO()?.emit('presence:update', { userId: botUserId, status: 'online' });
  if (timer) clearInterval(timer);
  timer = setInterval(tick, TICK_MS);
  tick(); // одразу одна дія, щоб не чекати
  return getBotStatus();
}

export async function stopBot() {
  running = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (botUserId) {
    await usersRepo.updateStatus(botUserId, 'away'); // на паузі -> away (live)
    getIO()?.emit('presence:update', { userId: botUserId, status: 'away' });
  }
  return getBotStatus();
}

export function getBotStatus() {
  return { running, ticketId, botUserId };
}
