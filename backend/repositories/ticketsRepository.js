const pool = require('../db');

// Спільний SELECT з усіма JOIN — щоб не дублювати в findAll/findById
const SELECT_WITH_JOINS = `
  SELECT t.*, p.name AS project_name,
         u.name AS assignee_name, u.avatar_url AS assignee_avatar_url,
         u.avatar_color AS assignee_avatar_color, u.status AS assignee_status
  FROM tickets t
  LEFT JOIN projects p ON t.project_id = p.id
  LEFT JOIN users u ON t.assignee_id = u.id
`;

module.exports = {
  // Список з фільтрами (роль 'user' бачить лише свої; опційно по проєкту)
  async findAll({ userId, role, projectId }) {
    const conditions = [];
    const params = [];
    if (role === 'user') {
      conditions.push('(t.created_by = ? OR t.assignee_id = ?)');
      params.push(userId, userId);
    }
    if (projectId) {
      conditions.push('t.project_id = ?');
      params.push(projectId);
    }
    let query = SELECT_WITH_JOINS;
    if (conditions.length) query += ` WHERE ${conditions.join(' AND ')} `;
    query += ' ORDER BY t.updated_at DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Один тікет (з JOIN-ами) — для сторінки тікета
  findById(id) {
    return pool.query(`${SELECT_WITH_JOINS} WHERE t.id = ?`, [id]).then(([r]) => r[0]);
  },

  // "Сирий" тікет без JOIN — для порівняння змін у PATCH і для subject у згадках
  findRaw(id) {
    return pool.query('SELECT * FROM tickets WHERE id = ?', [id]).then(([r]) => r[0]);
  },

  // Стрічка активності тікета
  findActivity(ticketId) {
    return pool.query(`
      SELECT a.*, u.name AS author_name, u.avatar_url AS author_avatar_url, u.avatar_color AS author_avatar_color
      FROM activity a
      JOIN users u ON a.user_id = u.id
      WHERE a.ticket_id = ?
      ORDER BY a.created_at ASC
    `, [ticketId]).then(([r]) => r);
  },

  async create(t) {
    const [result] = await pool.query(
      `INSERT INTO tickets (project_id, subject, body, status, priority, ticket_type, created_by, assignee_id, is_private)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.project_id || null, t.subject, t.body || null, t.status || 'NEW', t.priority || 'NORMAL',
       t.ticket_type || 'Task', t.created_by, t.assignee_id || null, t.is_private ? 1 : 0]
    );
    return result.insertId;
  },

  update(id, f) {
    return pool.query(
      `UPDATE tickets SET
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        assignee_id = ?,
        subject = COALESCE(?, subject),
        body = COALESCE(?, body),
        project_id = ?,
        ticket_type = COALESCE(?, ticket_type)
       WHERE id = ?`,
      [f.status, f.priority, f.assignee_id, f.subject, f.body, f.project_id, f.ticket_type, id]
    );
  },

  touch(id) {
    return pool.query('UPDATE tickets SET updated_at = NOW() WHERE id = ?', [id]);
  },

  // ОДИН універсальний метод замість 5 розкиданих INSERT-ів у activity
  addActivity({ ticketId, userId, type, content = null, oldValue = null, newValue = null }) {
    return pool.query(
      'INSERT INTO activity (ticket_id, user_id, type, content, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?)',
      [ticketId, userId, type, content, oldValue, newValue]
    );
  },
};
