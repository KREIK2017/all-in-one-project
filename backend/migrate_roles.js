const pool = require('./db');
require('dotenv').config();

async function migrate() {
  try {
    console.log('--- Database Migration: Add role column ---');
    await pool.query("ALTER TABLE users ADD COLUMN role ENUM('admin', 'user') DEFAULT 'user'");
    
    // Make the first user an admin for testing if no admin exists
    const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin'");
    if (admins.length === 0) {
      await pool.query("UPDATE users SET role = 'admin' LIMIT 1");
      console.log('✅ Success: First user promoted to admin');
    }
    
    console.log('✅ Success: role column added to users table');
    process.exit(0);
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log('ℹ️ Column role already exists');
      process.exit(0);
    }
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
