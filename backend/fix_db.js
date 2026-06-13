const pool = require('./db');

async function fixColumn() {
  try {
    console.log('Renaming projects.NAME to projects.name...');
    await pool.query('ALTER TABLE projects CHANGE COLUMN NAME name VARCHAR(150) NOT NULL');
    console.log('Success!');
    
    console.log('\n--- Verified Data ---');
    const [rows] = await pool.query('SELECT * FROM projects WHERE is_active = 1 LIMIT 5');
    console.table(rows);
    
    process.exit(0);
  } catch (err) {
    console.error('Fix failed:', err);
    process.exit(1);
  }
}

fixColumn();
