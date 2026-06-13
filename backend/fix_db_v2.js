const pool = require('./db');

async function fixAll() {
  try {
    console.log('--- Fixing Column Casing ---');
    
    // Tickets
    try {
      console.log('Renaming tickets.SUBJECT -> tickets.subject');
      await pool.query('ALTER TABLE tickets CHANGE COLUMN SUBJECT subject VARCHAR(255) NOT NULL');
      console.log('Renaming tickets.STATUS -> tickets.status');
      await pool.query("ALTER TABLE tickets CHANGE COLUMN STATUS status ENUM('NEW','IN_PROGRESS','COMPLETED','CLOSED') DEFAULT 'NEW'");
    } catch (e) { console.log('Tickets table already correct or error:', e.message); }

    // Activity
    try {
      console.log('Renaming activity.TYPE -> activity.type');
      await pool.query("ALTER TABLE activity CHANGE COLUMN TYPE type ENUM('comment','status_change','reassign','time_log') NOT NULL");
    } catch (e) { console.log('Activity table already correct or error:', e.message); }

    console.log('\n--- Creating Missing Tables ---');
    
    // time_entries
    await pool.query(`
      CREATE TABLE IF NOT EXISTS time_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        project_id INT NOT NULL,
        ticket_id INT DEFAULT NULL,
        description TEXT DEFAULT NULL,
        start_time DATETIME NOT NULL,
        end_time DATETIME DEFAULT NULL,
        duration_minutes INT DEFAULT 0,
        is_manual TINYINT(1) DEFAULT 0,
        edited_by INT DEFAULT NULL,
        edited_at TIMESTAMP NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL,
        FOREIGN KEY (edited_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('Table time_entries verified/created.');

    // active_timers (just in case)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS active_timers (
        user_id INT PRIMARY KEY,
        project_id INT NOT NULL,
        ticket_id INT DEFAULT NULL,
        description TEXT DEFAULT NULL,
        started_at DATETIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);
    console.log('Table active_timers verified/created.');

    console.log('\n--- Final Verification ---');
    const [t_cols] = await pool.query('SHOW COLUMNS FROM tickets');
    console.table(t_cols);
    
    process.exit(0);
  } catch (err) {
    console.error('Fix failed:', err);
    process.exit(1);
  }
}

fixAll();
