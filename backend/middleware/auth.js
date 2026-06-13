const jwt = require('jsonwebtoken');

module.exports = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user details including role
    const pool = require('../db');
    const [[user]] = await pool.query('SELECT id, role FROM users WHERE id = ?', [decoded.id]);
    if (!user) return res.status(401).json({ error: 'User not found' });
    
    req.user = user; // { id, role }
    next();
  } catch (err) {
    res.status(401).json({ error: 'Auth failed: invalid token' });
  }
};
