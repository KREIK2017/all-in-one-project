const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all projects
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM projects WHERE is_active = 1 ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a project
router.post('/', async (req, res) => {
  const { name, client_name, color } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO projects (name, client_name, color) VALUES (?, ?, ?)',
      [name, client_name || null, color || '#00f2fe']
    );
    res.status(201).json({ id: result.insertId, name, client_name, color });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a project
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('UPDATE projects SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
