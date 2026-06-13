const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    try {
        const pool = mysql.createPool({ 
            host: process.env.DB_HOST, 
            user: process.env.DB_USER, 
            password: process.env.DB_PASSWORD, 
            database: process.env.DB_NAME 
        });

        console.log('Updating activity enum type...');
        await pool.query(`
            ALTER TABLE activity 
            MODIFY COLUMN type ENUM(
                'comment', 
                'status_change', 
                'priority_change', 
                'reassign', 
                'time_log', 
                'type_change', 
                'subject_change', 
                'ticket_updated'
            ) NOT NULL
        `);
        console.log('Enum updated successfully.');

        console.log('Fixing existing empty type records...');
        // Correcting records where type became '' because type_change wasn't in enum
        await pool.query(`
            UPDATE activity 
            SET type = 'type_change' 
            WHERE type = '' 
            AND (old_value IN ('Task', 'Bug', 'Feature', 'Support') OR new_value IN ('Task', 'Bug', 'Feature', 'Support'))
        `);
        console.log('Records fixed.');

        console.log('Database synchronization complete!');
        process.exit(0);
    } catch (err) {
        console.error('Error updating database:', err);
        process.exit(1);
    }
})();
