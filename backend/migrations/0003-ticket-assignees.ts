import type { Migration } from '../db/umzug';

// Багато-до-багатьох: один тікет — кілька виконавців.
export const up: Migration = async ({ context: qi }) => {
  const s = qi.sequelize;
  await s.query(`
    CREATE TABLE ticket_assignees (
      ticket_id INT NOT NULL,
      user_id INT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (ticket_id, user_id),
      CONSTRAINT ta_ibfk_1 FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
      CONSTRAINT ta_ibfk_2 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  // Перенести наявних одиночних виконавців у нову таблицю
  await s.query(
    'INSERT INTO ticket_assignees (ticket_id, user_id) SELECT id, assignee_id FROM tickets WHERE assignee_id IS NOT NULL'
  );
};

export const down: Migration = async ({ context: qi }) => {
  await qi.sequelize.query('DROP TABLE IF EXISTS ticket_assignees');
};
