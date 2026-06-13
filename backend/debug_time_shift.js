
require('dotenv').config();
const mysql = require('mysql2/promise');

async function debugTime() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'all_in_one',
    waitForConnections: true,
    connectionLimit: 10
  });

  try {
    console.log('--- Server/DB Time Info ---');
    const [timeInfo] = await pool.query('SELECT NOW() as db_now, @@system_time_zone as sys_tz, @@time_zone as session_tz');
    console.log('DB Now:', timeInfo[0].db_now);
    console.log('System TZ:', timeInfo[0].sys_tz);
    console.log('Session TZ:', timeInfo[0].session_tz);
    console.log('JS Now:', new Date().toLocaleString());

    console.log('\n--- Recent Time Entries ---');
    const [entries] = await pool.query(`
      SELECT te.*, p.name as project_name 
      FROM time_entries te 
      JOIN projects p ON te.project_id = p.id 
      ORDER BY te.id DESC LIMIT 5
    `);
    console.table(entries.map(e => ({
      id: e.id,
      project: e.project_name,
      duration: e.duration_minutes,
      start: e.start_time,
      end: e.end_time,
      work_date_sql: e.start_time ? e.start_time.toISOString().split('T')[0] : 'N/A'
    })));

    console.log('\n--- Active Timers ---');
    const [timers] = await pool.query('SELECT * FROM active_timers');
    console.table(timers);

  } catch (err) {
    console.error('Debug failed:', err);
  } finally {
    await pool.end();
  }
}

debugTime();
