const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/avatars';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user_${req.user.id}_${Date.now()}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const check = allowed.test(path.extname(file.originalname).toLowerCase());
    if (check) cb(null, true);
    else cb(new Error('Only images allowed!'));
  }
});

// @route   GET api/users/profile/:id
router.get('/profile/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [[user]] = await pool.query('SELECT id, name, email, handle, avatar_color, avatar_url, created_at FROM users WHERE id = ?', [id]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [[ticketCount]] = await pool.query('SELECT COUNT(*) as count FROM tickets WHERE assignee_id = ?', [id]);
    const [[projectCount]] = await pool.query('SELECT COUNT(DISTINCT project_id) as count FROM time_entries WHERE user_id = ?', [id]);
    const [[timeCount]] = await pool.query('SELECT SUM(duration_minutes) as minutes FROM time_entries WHERE user_id = ?', [id]);

    res.json({
      ...user,
      stats: {
        tickets: ticketCount.count,
        projects: projectCount.count,
        totalHours: (timeCount.minutes / 60).toFixed(1)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   PATCH api/users/profile
router.patch('/profile', auth, async (req, res) => {
  const { name, email, avatar_color } = req.body;
  const userId = req.user.id;
  try {
    // Check if email already taken by someone else
    const [[existing]] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
    if (existing) return res.status(400).json({ error: 'Email already taken' });

    await pool.query(
      'UPDATE users SET name = ?, email = ?, avatar_color = ? WHERE id = ?',
      [name, email, avatar_color, userId]
    );
    res.json({ success: true, user: { id: userId, name, email, avatar_color } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   PATCH api/users/change-password
router.patch('/change-password', auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;
  try {
    const [[user]] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Поточний пароль невірний' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId]);

    res.json({ success: true, message: 'Пароль успішно змінено' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   POST api/users/upload-avatar
router.post('/upload-avatar', auth, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const userId = req.user.id;
  const url = `http://localhost:3001/uploads/avatars/${req.file.filename}`;
  try {
    await pool.query('UPDATE users SET avatar_url = ? WHERE id = ?', [url, userId]);
    res.json({ success: true, avatar_url: url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   DELETE api/users/delete-avatar
router.delete('/delete-avatar', auth, async (req, res) => {
  const userId = req.user.id;
  try {
    await pool.query('UPDATE users SET avatar_url = NULL WHERE id = ?', [userId]);
    res.json({ success: true, message: 'Avatar deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   PATCH api/users/update-status
router.patch('/update-status', auth, async (req, res) => {
  const { status } = req.body;
  const userId = req.user.id;
  try {
    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
