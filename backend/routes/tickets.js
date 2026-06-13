const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { sendNotificationEmail } = require('../services/emailService');

// GET all tickets (with project name and assignee)
router.get('/', auth, async (req, res) => {
  const { projectId } = req.query;
  try {
    const isUser = req.user.role === 'user';
    let query = `
      SELECT t.*, p.name AS project_name, u.name AS assignee_name, u.avatar_url AS assignee_avatar_url, u.avatar_color AS assignee_avatar_color, u.status AS assignee_status
      FROM tickets t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assignee_id = u.id
    `;
    
    const params = [];
    const conditions = [];

    if (isUser) {
      conditions.push('(t.created_by = ? OR t.assignee_id = ?)');
      params.push(req.user.id, req.user.id);
    }

    if (projectId) {
      conditions.push('t.project_id = ?');
      params.push(projectId);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')} `;
    }

    query += ' ORDER BY t.updated_at DESC';
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single ticket with activity
router.get('/:id', async (req, res) => {
  try {
    const [[ticket]] = await pool.query(`
      SELECT t.*, p.name AS project_name, u.name AS assignee_name, u.avatar_url AS assignee_avatar_url, u.avatar_color AS assignee_avatar_color, u.status AS assignee_status
      FROM tickets t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users u ON t.assignee_id = u.id
      WHERE t.id = ?
    `, [req.params.id]);

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    const [activity] = await pool.query(`
      SELECT a.*, u.name AS author_name, u.avatar_url AS author_avatar_url, u.avatar_color AS author_avatar_color
      FROM activity a
      JOIN users u ON a.user_id = u.id
      WHERE a.ticket_id = ?
      ORDER BY a.created_at ASC
    `, [req.params.id]);

    res.json({ ...ticket, activity });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a ticket
router.post('/', async (req, res) => {
  const { project_id, subject, body, status, priority, ticket_type, created_by, assignee_id, is_private } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO tickets (project_id, subject, body, status, priority, ticket_type, created_by, assignee_id, is_private)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [project_id || null, subject, body || null, status || 'NEW', priority || 'NORMAL',
       ticket_type || 'Task', created_by, assignee_id || null, is_private ? 1 : 0]
    );
    // Log activity
    await pool.query(
      `INSERT INTO activity (ticket_id, user_id, type, new_value) VALUES (?, ?, 'status_change', 'NEW')`,
      [result.insertId, created_by]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add a comment
router.post('/:id/comments', async (req, res) => {
  const { user_id, content } = req.body;
  try {
    await pool.query(
      `INSERT INTO activity (ticket_id, user_id, type, content) VALUES (?, ?, 'comment', ?)`,
      [req.params.id, user_id, content]
    );
    // Update ticket's updated_at
    await pool.query(`UPDATE tickets SET updated_at = NOW() WHERE id = ?`, [req.params.id]);

    // --- Notifications Logic (Safe & Non-blocking) ---
    try {
        const mentionRegex = /@(\w+)/g;
        const mentions = [...content.matchAll(mentionRegex)].map(m => m[1]);
        
        if (mentions.length > 0) {
            const [[ticket]] = await pool.query('SELECT subject FROM tickets WHERE id = ?', [req.params.id]);
            const [[actor]] = await pool.query('SELECT name FROM users WHERE id = ?', [user_id]);

            if (ticket && actor) {
                for (const username of mentions) {
                    const [[targetUser]] = await pool.query('SELECT id, email, name FROM users WHERE name = ? OR email LIKE ?', [username, `${username}%`]);
                    
                    if (targetUser && targetUser.id !== parseInt(user_id || 0)) {
                        const msg = `${actor.name} mentioned you in ticket: ${ticket.subject}`;
                        await pool.query(
                            'INSERT INTO notifications (user_id, actor_id, type, target_id, message) VALUES (?, ?, ?, ?, ?)',
                            [targetUser.id, user_id, 'mention', req.params.id, msg]
                        );

                        await sendNotificationEmail(
                            targetUser.email,
                            `You were mentioned in "${ticket.subject}"`,
                            msg,
                            `<p><strong>${actor.name}</strong> mentioned you in a comment on ticket <strong>"${ticket.subject}"</strong>:</p><blockquote style="border-left: 4px solid #eee; padding-left: 10px; color: #666;">${content}</blockquote><p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/tickets/${req.params.id}">View Ticket</a></p>`
                        );
                    }
                }
            }
        }
    } catch (notifErr) {
        console.error(' [Notification Error - Comment]:', notifErr);
    }

    res.status(201).json({ success: true });
  } catch (err) {
    console.error(' [Tickets COMMENT Error]:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH update ticket properties
router.patch('/:id', async (req, res) => {
  const { status, priority, assignee_id, subject, body, project_id, user_id, ticket_type } = req.body;
  try {
    const [[current]] = await pool.query('SELECT * FROM tickets WHERE id = ?', [req.params.id]);
    if (!current) return res.status(404).json({ error: 'Not found' });

    const cleanAssignee = assignee_id === '' ? null : assignee_id;
    const cleanProject = project_id === '' ? null : project_id;

    await pool.query(
      `UPDATE tickets SET 
        status = COALESCE(?, status), 
        priority = COALESCE(?, priority), 
        assignee_id = ?,
        subject = COALESCE(?, subject),
        body = COALESCE(?, body),
        project_id = ?,
        ticket_type = COALESCE(?, ticket_type)
       WHERE id = ?`,
      [status, priority, cleanAssignee, subject, body, cleanProject, ticket_type, req.params.id]
    );

    // Log changes in activity
    const changes = [];
    if (status && status !== current.status) changes.push({ type: 'status_change', old: current.status, new: status });
    if (priority && priority !== current.priority) changes.push({ type: 'priority_change', old: current.priority, new: priority });
    if (assignee_id !== undefined && (cleanAssignee || 0) !== (current.assignee_id || 0)) {
      changes.push({ type: 'reassign', old: current.assignee_id, new: cleanAssignee });
    }
    if (subject && subject !== current.subject) changes.push({ type: 'subject_change', old: current.subject, new: subject });
    if (ticket_type && ticket_type !== current.ticket_type) changes.push({ type: 'type_change', old: current.ticket_type, new: ticket_type });

    for (const change of changes) {
      await pool.query(
        `INSERT INTO activity (ticket_id, user_id, type, old_value, new_value) VALUES (?, ?, ?, ?, ?)`,
        [req.params.id, user_id, change.type, change.old, change.new]
      );

      // Trigger Notification for reassignment (Safe & Non-blocking)
      if (change.type === 'reassign' && change.new && parseInt(change.new) !== parseInt(user_id || 0)) {
          try {
              const [[targetUser]] = await pool.query('SELECT id, email, name FROM users WHERE id = ?', [change.new]);
              const [[actor]] = await pool.query('SELECT name FROM users WHERE id = ?', [user_id]);
              const [[ticket]] = await pool.query('SELECT subject FROM tickets WHERE id = ?', [req.params.id]);

              if (targetUser && actor && ticket) {
                  const msg = `${actor.name} assigned a ticket to you: ${ticket.subject}`;
                  await pool.query(
                      'INSERT INTO notifications (user_id, actor_id, type, target_id, message) VALUES (?, ?, ?, ?, ?)',
                      [targetUser.id, user_id, 'assignment', req.params.id, msg]
                  );

                  await sendNotificationEmail(
                      targetUser.email,
                      `New Ticket Assigned: ${ticket.subject}`,
                      msg,
                      `<p><strong>${actor.name}</strong> assigned you to the ticket: <strong>"${ticket.subject}"</strong>.</p><p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/tickets/${req.params.id}">View Ticket</a></p>`
                  );
              }
          } catch (notifErr) {
              console.error(' [Notification Error - Assignment]:', notifErr);
          }
      }
    }
    
    // If body or project changed, log simple update
    if ((body !== undefined && body !== current.body) || (project_id !== undefined && cleanProject !== current.project_id)) {
       await pool.query(
        `INSERT INTO activity (ticket_id, user_id, type) VALUES (?, ?, 'ticket_updated')`,
        [req.params.id, user_id]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error(' [Tickets PATCH Error]:', err.stack || err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
