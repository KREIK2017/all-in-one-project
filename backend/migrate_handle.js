const pool = require('./db');
require('dotenv').config();

async function migrate() {
  try {
    console.log('--- Database Migration: Add handle column to users ---');
    await pool.query('ALTER TABLE users ADD COLUMN handle VARCHAR(50) UNIQUE DEFAULT NULL');
    console.log('✅ Success: handle column added');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
