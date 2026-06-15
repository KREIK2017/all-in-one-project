const pool = require('../db');

module.exports = {
  findActive() {
    return pool
      .query('SELECT * FROM projects WHERE is_active = 1 ORDER BY name ASC')
      .then(([rows]) => rows);
  },

  async create({ name, client_name, color }) {
    const [result] = await pool.query(
      'INSERT INTO projects (name, client_name, color) VALUES (?, ?, ?)',
      [name, client_name || null, color || '#00f2fe']
    );
    return result.insertId;
  },

  // М'яке видалення: проєкт ховається, але дані (тікети/час) лишаються
  softDelete(id) {
    return pool.query('UPDATE projects SET is_active = 0 WHERE id = ?', [id]);
  },
};
