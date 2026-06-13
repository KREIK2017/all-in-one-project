const pool = require('./db');
require('dotenv').config();

async function migrate() {
  try {
    console.log('--- Database Migration: Add avatar_url ---');
    await pool.query('ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) DEFAULT NULL');
    console.log('✅ Success: avatar_url added to users table');
    process.exit(0);
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log('ℹ️ Column avatar_url already exists');
      process.exit(0);
    }
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
