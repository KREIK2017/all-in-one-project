const pool = require('./db');

async function deepDebug() {
  try {
    console.log('--- Ticket 1 (Raw) ---');
    const [tickets] = await pool.query('SELECT * FROM tickets LIMIT 1');
    if (tickets.length > 0) {
      console.log('Keys:', Object.keys(tickets[0]));
      console.log('Data:', JSON.stringify(tickets[0], null, 2));
    } else {
      console.log('No tickets found.');
    }

    console.log('\n--- Activity 1 (Raw) ---');
    const [activity] = await pool.query('SELECT * FROM activity LIMIT 1');
    if (activity.length > 0) {
      console.log('Keys:', Object.keys(activity[0]));
      console.log('Data:', JSON.stringify(activity[0], null, 2));
    } else {
      console.log('No activity found.');
    }

    console.log('\n--- Active Timers Table Structure ---');
    const [at_cols] = await pool.query('SHOW COLUMNS FROM active_timers');
    console.table(at_cols);

    process.exit(0);
  } catch (err) {
    console.error('Debug failed:', err);
    process.exit(1);
  }
}

deepDebug();
