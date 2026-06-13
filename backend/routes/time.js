const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET billing summary (for Reports page)
// Aggregates time_entries grouped by project and day
router.get('/billing', async (req, res) => {
  const { start, end, user_id } = req.query; 
  try {
    let query = `
      SELECT 
        p.name AS project_name, 
        p.color,
        DATE_FORMAT(te.start_time, '%Y-%m-%d') AS work_date,
        SUM(te.duration_minutes) AS total_minutes
      FROM time_entries te
      JOIN projects p ON te.project_id = p.id
      WHERE te.start_time >= ? AND te.start_time <= ?
    `;

    const params = [start || '2026-01-01', end || '2099-01-01'];

    if (user_id) {
      query += ` AND te.user_id = ? `;
      params.push(user_id);
    }

    query += `
      GROUP BY p.id, DATE(te.start_time)
      ORDER BY p.name, work_date
    `;

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST start timer (creates active_timer entry)
router.post('/start', async (req, res) => {
  const { user_id, project_id, ticket_id, description } = req.body;
  try {
    // Stop any existing timer for this user first
    await pool.query('DELETE FROM active_timers WHERE user_id = ?', [user_id]);
    // Start new timer
    await pool.query(
      `INSERT INTO active_timers (user_id, project_id, ticket_id, description, started_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [user_id, project_id, ticket_id || null, description || null]
    );
    res.json({ success: true, started_at: new Date() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST stop timer (saves to time_entries and removes active_timer)
router.post('/stop', async (req, res) => {
  const { user_id } = req.body;
  try {
    const [[timer]] = await pool.query('SELECT * FROM active_timers WHERE user_id = ?', [user_id]);
    if (!timer) return res.status(404).json({ error: 'No active timer' });

    const startedAt = new Date(timer.started_at);
    const endedAt = new Date();
    const durationMinutes = Math.round((endedAt - startedAt) / 60000);

    const [result] = await pool.query(
      `INSERT INTO time_entries (user_id, project_id, ticket_id, description, start_time, end_time, duration_minutes)
       VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
      [user_id, timer.project_id, timer.ticket_id, timer.description, timer.started_at, durationMinutes]
    );

    // Log time in ticket activity if linked to ticket
    if (timer.ticket_id) {
      await pool.query(
        `INSERT INTO activity (ticket_id, user_id, type, content) VALUES (?, ?, 'time_log', ?)`,
        [timer.ticket_id, user_id, `added ${durationMinutes} mins to time tracking`]
      );
    }

    // Remove active timer
    await pool.query('DELETE FROM active_timers WHERE user_id = ?', [user_id]);

    res.json({ success: true, entry_id: result.insertId, duration_minutes: durationMinutes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET active timer state for a user
router.get('/active/:user_id', async (req, res) => {
  try {
    const [[timer]] = await pool.query(
      `SELECT at.*, p.name AS project_name, t.subject AS ticket_subject
       FROM active_timers at 
       LEFT JOIN projects p ON at.project_id = p.id 
       LEFT JOIN tickets t ON at.ticket_id = t.id
       WHERE at.user_id = ?`,
      [req.params.user_id]
    );
    if (!timer) return res.json({ active: false });
    
    const elapsed = Math.floor((Date.now() - new Date(timer.started_at)) / 1000);
    res.json({ active: true, ...timer, elapsed_seconds: elapsed });
  } catch (err) {
    console.error('Error fetching active timer for user:', req.params.user_id, err);
    res.status(500).json({ error: 'Помилка при отриманні активного таймера', details: err.message });
  }
});

// POST add manual time entry
router.post('/manual', async (req, res) => {
  const { user_id, project_id, ticket_id, duration_minutes, description } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO time_entries (user_id, project_id, ticket_id, description, start_time, end_time, duration_minutes, is_manual)
       VALUES (?, ?, ?, ?, NOW(), NOW(), ?, 1)`,
      [user_id, project_id, ticket_id || null, description || null, duration_minutes]
    );

    // Log in ticket activity
    if (ticket_id) {
       const action = duration_minutes > 0 ? 'added' : 'removed';
       const absMinutes = Math.abs(duration_minutes);
       
       await pool.query(
         `INSERT INTO activity (ticket_id, user_id, type, content) VALUES (?, ?, 'time_log', ?)`,
         [ticket_id, user_id, `${action} ${absMinutes} mins to time tracking (manual)`]
       );
    }

    res.status(201).json({ success: true, entry_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH manually edit a time entry
router.patch('/entries/:id', async (req, res) => {
  const { duration_minutes, user_id } = req.body;
  try {
    await pool.query(
      `UPDATE time_entries SET duration_minutes = ?, is_manual = 1, edited_by = ?, edited_at = NOW() WHERE id = ?`,
      [duration_minutes, user_id, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
