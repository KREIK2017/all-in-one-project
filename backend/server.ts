import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
import sequelize from './config/sequelize';

// Routes
import projectsRouter from './routes/projects';
import ticketsRouter from './routes/tickets';
import timeRouter from './routes/time';
import authRouter from './routes/auth';
import statsRouter from './routes/stats';
import usersRouter from './routes/users';
import notificationsRouter from './routes/notifications';
import errorHandler from './middleware/errorHandler';
import { migrator } from './db/umzug';
import { seed } from './db/seed';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // дозволяємо віддавати аватари на фронт
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'OK', db: 'Connected to aio_dashboard' });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', db: (err as Error).message });
  }
});

// API Routes
app.use('/api/projects', projectsRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/time', timeRouter);
app.use('/api/auth', authRouter);
app.use('/api/stats', statsRouter);
app.use('/api/users', usersRouter);
app.use('/api/notifications', notificationsRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Глобальний обробник помилок — останнім
app.use(errorHandler);

// Старт: застосувати міграції (схема в коді) -> засіяти демо-дані, якщо порожньо -> слухати
async function start() {
  await migrator.up(); // застосовує лише pending-міграції (вже застосовані пропускає)
  await seed(); // idempotent: сіє лише якщо users порожні
  app.listen(PORT, () => {
    console.log(`\n🚀 AIO Dashboard Server running on http://localhost:${PORT}`);
    console.log(`📊 DB: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
  });
}

start().catch((err) => {
  console.error('❌ Startup failed:', err);
  process.exit(1);
});
