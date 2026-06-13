const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function fixNames() {
  try {
    console.log('--- Fixing User Names ---');
    const [users] = await pool.query('SELECT id, name, email FROM users');
    
    for (const user of users) {
      if (!user.name || user.name.trim() === '') {
        const defaultName = user.email.split('@')[0];
        console.log(`Fixing user ${user.id} (${user.email}): Setting name to ${defaultName}`);
        await pool.query('UPDATE users SET name = ? WHERE id = ?', [defaultName, user.id]);
      }
    }
    
    console.log('✅ Success: All names restored');
    process.exit(0);
  } catch (err) {
    console.error('Error fixing names:', err);
    process.exit(1);
  }
}

fixNames();
