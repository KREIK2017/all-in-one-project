import { Server, Socket } from 'socket.io';
import type { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import usersRepo from './repositories/usersRepository';

const GRACE_MS = 8000; // скільки чекати реконекту (refresh) перед тим, як ставити offline
const ALLOWED_MANUAL = ['online', 'away', 'dnd', 'invisible'];

// userId -> { count активних сокетів, timer відкладеного offline }
const presence = new Map<number, { count: number; timer?: NodeJS.Timeout }>();

export function initSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true },
  });

  // Авторизація сокета по JWT (токен у handshake.auth.token)
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('No token'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: number };
      socket.data.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket: Socket) => {
    const userId = socket.data.userId as number;

    const entry = presence.get(userId) || { count: 0 };
    if (entry.timer) {
      clearTimeout(entry.timer); // переконект (refresh) у межах grace — скасовуємо offline
      entry.timer = undefined;
    }
    const wasOffline = entry.count === 0;
    entry.count += 1;
    presence.set(userId, entry);

    // Перша активна вкладка: якщо в БД був offline — ставимо online, інакше лишаємо обраний статус
    if (wasOffline) {
      const user = await usersRepo.findById(userId);
      let status = (user?.status as string) || 'online';
      if (status === 'offline') {
        status = 'online';
        await usersRepo.updateStatus(userId, 'online');
      }
      io.emit('presence:update', { userId, status });
    }

    // Ручна зміна статусу (away/dnd/invisible/online) — зберігаємо + миттєво транслюємо
    socket.on('presence:set', async (status: string) => {
      if (!ALLOWED_MANUAL.includes(status)) return;
      await usersRepo.updateStatus(userId, status);
      io.emit('presence:update', { userId, status });
    });

    socket.on('disconnect', () => {
      const e = presence.get(userId);
      if (!e) return;
      e.count -= 1;
      if (e.count <= 0) {
        // Остання вкладка закрилась: чекаємо grace, і якщо реконекту не було — offline
        e.timer = setTimeout(async () => {
          presence.delete(userId);
          await usersRepo.updateStatus(userId, 'offline');
          io.emit('presence:update', { userId, status: 'offline' });
        }, GRACE_MS);
      }
    });
  });

  return io;
}
