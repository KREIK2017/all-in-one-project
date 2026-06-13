const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Adding theme and font columns to users table...');
    
    // Add theme column with default 'dark'
    await connection.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'dark',
      ADD COLUMN IF NOT EXISTS font VARCHAR(50) DEFAULT 'Inter'
    `);
    
    console.log('Columns added successfully!');
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log('Columns already exist.');
    } else {
      console.error('Error adding columns:', err);
    }
  } finally {
    await connection.end();
  }
})();
