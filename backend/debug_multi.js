const pool = require('./db');

async function debugTables() {
  try {
    const tables = ['tickets', 'activity', 'time_entries', 'active_timers'];
    
    for (const table of tables) {
      console.log(`\n--- Table: ${table} ---`);
      const [columns] = await pool.query(`SHOW COLUMNS FROM ${table}`);
      console.table(columns);
    }

    console.log('\n--- Sample Ticket Data ---');
    const [tickets] = await pool.query('SELECT * FROM tickets LIMIT 3');
    console.table(tickets);

    process.exit(0);
  } catch (err) {
    console.error('Debug failed:', err);
    process.exit(1);
  }
}

debugTables();
