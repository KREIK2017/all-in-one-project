import type { Migration } from '../db/umzug';

// Прибираємо застарілу колонку tickets.assignee_id (виконавці тепер у ticket_assignees).
export const up: Migration = async ({ context: qi }) => {
  const s = qi.sequelize;
  await s.query('ALTER TABLE tickets DROP FOREIGN KEY tickets_ibfk_3'); // спершу FK
  await s.query('ALTER TABLE tickets DROP COLUMN assignee_id');
};

export const down: Migration = async ({ context: qi }) => {
  const s = qi.sequelize;
  await s.query('ALTER TABLE tickets ADD COLUMN assignee_id INT DEFAULT NULL');
  // повернути першого виконавця з junction (для сумісності)
  await s.query(
    'UPDATE tickets t SET assignee_id = (SELECT user_id FROM ticket_assignees ta WHERE ta.ticket_id = t.id ORDER BY ta.user_id LIMIT 1)'
  );
  await s.query(
    'ALTER TABLE tickets ADD CONSTRAINT tickets_ibfk_3 FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL'
  );
};
