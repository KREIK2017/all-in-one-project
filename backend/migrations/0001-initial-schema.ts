import type { Migration } from '../db/umzug';

const OPTS = 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';

// Початкова схема: усі 7 таблиць із точними enum'ами та зовнішніми ключами.
export const up: Migration = async ({ context: qi }) => {
  const s = qi.sequelize;

  await s.query(`
    CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      avatar_color VARCHAR(20) DEFAULT '#00f2fe',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      avatar_url VARCHAR(255) DEFAULT NULL,
      status ENUM('online','away','dnd','invisible') DEFAULT 'online',
      role ENUM('admin','user') DEFAULT 'user',
      handle VARCHAR(50) DEFAULT NULL UNIQUE,
      theme VARCHAR(20) DEFAULT 'dark',
      font VARCHAR(50) DEFAULT 'Inter'
    ) ${OPTS};
  `);

  await s.query(`
    CREATE TABLE projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      client_name VARCHAR(150) DEFAULT NULL,
      color VARCHAR(20) DEFAULT '#00f2fe',
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ${OPTS};
  `);

  await s.query(`
    CREATE TABLE tickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT DEFAULT NULL,
      subject VARCHAR(255) NOT NULL,
      body TEXT DEFAULT NULL,
      status ENUM('NEW','IN_PROGRESS','COMPLETED','CLOSED') DEFAULT 'NEW',
      priority ENUM('NORMAL','HIGH') DEFAULT 'NORMAL',
      ticket_type ENUM('Feature','Bug','Task','Support') DEFAULT 'Task',
      created_by INT NOT NULL,
      assignee_id INT DEFAULT NULL,
      is_private TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT tickets_ibfk_1 FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
      CONSTRAINT tickets_ibfk_2 FOREIGN KEY (created_by) REFERENCES users(id),
      CONSTRAINT tickets_ibfk_3 FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL
    ) ${OPTS};
  `);

  await s.query(`
    CREATE TABLE activity (
      id INT AUTO_INCREMENT PRIMARY KEY,
      ticket_id INT NOT NULL,
      user_id INT NOT NULL,
      type ENUM('comment','status_change','priority_change','reassign','subject_change','type_change','ticket_updated','time_log') NOT NULL,
      content TEXT DEFAULT NULL,
      old_value VARCHAR(100) DEFAULT NULL,
      new_value VARCHAR(100) DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT activity_ibfk_1 FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
      CONSTRAINT activity_ibfk_2 FOREIGN KEY (user_id) REFERENCES users(id)
    ) ${OPTS};
  `);

  await s.query(`
    CREATE TABLE time_entries (
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
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT time_entries_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id),
      CONSTRAINT time_entries_ibfk_2 FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      CONSTRAINT time_entries_ibfk_3 FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL,
      CONSTRAINT time_entries_ibfk_4 FOREIGN KEY (edited_by) REFERENCES users(id) ON DELETE SET NULL
    ) ${OPTS};
  `);

  await s.query(`
    CREATE TABLE active_timers (
      user_id INT PRIMARY KEY,
      project_id INT NOT NULL,
      ticket_id INT DEFAULT NULL,
      description TEXT DEFAULT NULL,
      started_at DATETIME NOT NULL,
      CONSTRAINT active_timers_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT active_timers_ibfk_2 FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    ) ${OPTS};
  `);

  await s.query(`
    CREATE TABLE notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      actor_id INT NOT NULL,
      type ENUM('mention','assignment','status_update') NOT NULL,
      target_id INT NOT NULL,
      message TEXT DEFAULT NULL,
      is_read TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT notifications_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id),
      CONSTRAINT notifications_ibfk_2 FOREIGN KEY (actor_id) REFERENCES users(id)
    ) ${OPTS};
  `);
};

// Відкат — дропаємо у зворотному порядку залежностей
export const down: Migration = async ({ context: qi }) => {
  const s = qi.sequelize;
  for (const table of ['notifications', 'active_timers', 'time_entries', 'activity', 'tickets', 'projects', 'users']) {
    await s.query(`DROP TABLE IF EXISTS ${table};`);
  }
};
