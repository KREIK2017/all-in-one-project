const pool = require('./db');
require('dotenv').config();

async function migrate() {
  try {
    console.log('--- Database Migration: Expand activity types ---');
    // First, modify the ENUM to include priority_change, subject_change, and ticket_updated
    await pool.query(`
      ALTER TABLE activity 
      MODIFY COLUMN type ENUM('comment', 'status_change', 'reassign', 'time_log', 'priority_change', 'subject_change', 'ticket_updated') NOT NULL
    `);
    
    console.log('✅ Success: Activity types expanded');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
