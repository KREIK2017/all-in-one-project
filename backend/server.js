require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

// Routes
const projectsRouter = require('./routes/projects');
const ticketsRouter = require('./routes/tickets');
const timeRouter = require('./routes/time');
const authRouter = require('./routes/auth');
const statsRouter = require('./routes/stats');
const usersRouter = require('./routes/users');
const notificationsRouter = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Allow all origins for local development
app.use(express.json());
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK', db: 'Connected to aio_dashboard' });
  } catch (err) {
    res.status(500).json({ status: 'ERROR', db: err.message });
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
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 AIO Dashboard Server running on http://localhost:${PORT}`);
  console.log(`📊 DB: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
  console.log(`\n📌 Available endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/projects`);
  console.log(`   POST /api/projects`);
  console.log(`   GET  /api/tickets`);
  console.log(`   POST /api/tickets`);
  console.log(`   GET  /api/tickets/:id`);
  console.log(`   POST /api/time/start`);
  console.log(`   POST /api/time/stop`);
  console.log(`   GET  /api/time/active/:user_id`);
  console.log(`   GET  /api/time/billing?start=...&end=...`);
  console.log(`   PATCH /api/time/entries/:id`);
});
