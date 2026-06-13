const pool = require('./db');
require('dotenv').config();

async function migrate() {
  try {
    console.log('--- Database Migration: Add status column ---');
    await pool.query("ALTER TABLE users ADD COLUMN status ENUM('online', 'away', 'dnd', 'invisible') DEFAULT 'online'");
    console.log('✅ Success: status added to users table');
    process.exit(0);
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log('ℹ️ Column status already exists');
      process.exit(0);
    }
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
