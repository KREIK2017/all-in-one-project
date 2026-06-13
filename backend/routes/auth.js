const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const auth = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register user
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const [[existing]] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(400).json({ error: 'Користувач з таким email вже існує' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, hash]
    );

    const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, user: { id: result.insertId, name, email, role: 'user', handle: null, avatar_color: '#3e8488ff', avatar_url: null, theme: 'dark', font: 'Inter' } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Помилка сервера при реєстрації' });
  }
});

// @route   POST api/auth/login
// @desc    Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [[user]] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(400).json({ error: 'Невірний email або пароль' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Невірний email або пароль' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, handle: user.handle, avatar_color: user.avatar_color, avatar_url: user.avatar_url, theme: user.theme || 'dark', font: user.font || 'Inter' } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Помилка сервера при вході' });
  }
});

// @route   GET api/auth/me
// @desc    Get current user
router.get('/me', async (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Токен відсутній' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [[user]] = await pool.query('SELECT id, name, email, role, handle, avatar_color, avatar_url, theme, font FROM users WHERE id = ?', [decoded.id]);
    if (!user) return res.status(404).json({ error: 'Користувача не знайдено' });
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: 'Невірний токен' });
  }
});

// @route   GET api/auth/users
// @desc    Get all users (for filters)
router.get('/users', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, name, email, role, handle, avatar_color, avatar_url, status, created_at FROM users ORDER BY name ASC');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   PATCH api/auth/users/:id/role
// @desc    Update user role (Admin only)
router.patch('/users/:id/role', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Доступ заборонено' });
  const { role } = req.body;
  try {
    await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    res.json({ success: true, role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   DELETE api/auth/users/:id
// @desc    Delete user (Admin only)
router.delete('/users/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Доступ заборонено' });
  if (req.user.id === parseInt(req.params.id)) return res.status(400).json({ error: 'Ви не можете видалити самого себе' });
  
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// @route   PATCH api/auth/profile
// @desc    Update user profile (all fields)
router.patch('/profile', auth, async (req, res) => {
  const { handle, name, email, avatar_color } = req.body;
  const userId = req.user.id;
  try {
    // 1. Check Handle Uniqueness
    if (handle) {
       const [[existingHandle]] = await pool.query('SELECT id FROM users WHERE handle = ? AND id != ?', [handle, userId]);
       if (existingHandle) return res.status(400).json({ error: 'This User ID is already taken' });
    }
    
    // 2. Check Email Uniqueness
    if (email) {
       const [[existingEmail]] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
       if (existingEmail) return res.status(400).json({ error: 'This Email is already taken' });
    }

    // 3. Get current values for missing fields to avoid NULLs
    const [[current]] = await pool.query('SELECT name, email, avatar_color, handle, theme, font FROM users WHERE id = ?', [userId]);
    
    // Ensure name is never empty
    let finalName = name && name.trim() !== '' ? name : current.name;
    // Extreme fallback if DB was already empty
    if (!finalName || finalName.trim() === '') {
      finalName = current.email.split('@')[0];
    }

    const finalEmail = email || current.email;
    const finalColor = avatar_color || current.avatar_color;
    const finalHandle = handle !== undefined ? (handle || null) : current.handle;
    const finalTheme = req.body.theme || current.theme || 'dark';
    const finalFont = req.body.font || current.font || 'Inter';

    await pool.query(
      'UPDATE users SET name = ?, email = ?, avatar_color = ?, handle = ?, theme = ?, font = ? WHERE id = ?',
      [finalName, finalEmail, finalColor, finalHandle, finalTheme, finalFont, userId]
    );
    
    res.json({ 
      success: true, 
      user: { 
        id: userId, 
        name: finalName, 
        email: finalEmail, 
        avatar_color: finalColor, 
        handle: finalHandle,
        theme: finalTheme,
        font: finalFont
      } 
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// @route   GET api/auth/check-handle/:handle
// @desc    Check if handle is available
router.get('/check-handle/:handle', async (req, res) => {
  try {
    const [[existing]] = await pool.query('SELECT id FROM users WHERE handle = ?', [req.params.handle]);
    res.json({ available: !existing });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
