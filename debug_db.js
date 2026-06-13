const pool = require('./backend/db');

async function debugDB() {
  try {
    console.log('--- Table: projects ---');
    const [columns] = await pool.query('SHOW COLUMNS FROM projects');
    console.table(columns);

    console.log('\n--- Data: projects (is_active=1) ---');
    const [rows] = await pool.query('SELECT * FROM projects WHERE is_active = 1');
    console.table(rows);

    process.exit(0);
  } catch (err) {
    console.error('Debug failed:', err);
    process.exit(1);
  }
}

debugDB();
