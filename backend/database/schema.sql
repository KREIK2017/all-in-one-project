-- ==========================================================
-- All-in-One Dashboard DB Schema
-- Виконайте цей файл у phpMyAdmin (http://localhost/phpmyadmin)
-- Або в MySQL CLI: mysql -u root -p < schema.sql
-- ==========================================================

CREATE DATABASE IF NOT EXISTS aio_dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE aio_dashboard;

-- Таблиця користувачів
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_color VARCHAR(20) DEFAULT '#3e8488ff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблиця проектів
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  client_name VARCHAR(150) DEFAULT NULL,
  color VARCHAR(20) DEFAULT '#00f2fe',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблиця тікетів
CREATE TABLE IF NOT EXISTS tickets (
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (assignee_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Стрічка активності (коментарі, зміни статусів)
CREATE TABLE IF NOT EXISTS activity (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  user_id INT NOT NULL,
  type ENUM('comment','status_change','reassign','time_log') NOT NULL,
  content TEXT DEFAULT NULL,
  old_value VARCHAR(100) DEFAULT NULL,
  new_value VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Таблиця записів часу (для таймера та Billing Time)
CREATE TABLE IF NOT EXISTS time_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  project_id INT NOT NULL,
  ticket_id INT DEFAULT NULL,
  description TEXT DEFAULT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME DEFAULT NULL,
  duration_minutes INT DEFAULT 0,     -- Заповнюється при зупинці таймера або вручну
  is_manual TINYINT(1) DEFAULT 0,     -- 1 = введено вручну
  edited_by INT DEFAULT NULL,         -- Хто останній редагував
  edited_at TIMESTAMP DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL,
  FOREIGN KEY (edited_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Таблиця активних таймерів (для стану "таймер запущено")
CREATE TABLE IF NOT EXISTS active_timers (
  user_id INT PRIMARY KEY,
  project_id INT NOT NULL,
  ticket_id INT DEFAULT NULL,
  description TEXT DEFAULT NULL,
  started_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- ==========================================================
-- Тестові дані
-- ==========================================================
INSERT INTO users (name, email, password_hash, avatar_color) VALUES
  ('Maksim M', 'maksim@tuispace.com', '$2b$10$placeholder_hash', '#00f2fe'),
  ('Olga D',   'olga@tuispace.com',   '$2b$10$placeholder_hash', '#8e2de2'),
  ('Sasha V',  'sasha@tuispace.com',  '$2b$10$placeholder_hash', '#10b981');

INSERT INTO projects (name, client_name, color) VALUES
  ('D2R', NULL, '#ef4444'),
  ('Tui: One Isac', 'Tuispace LLC', '#8b5cf6'),
  ('Tui: Client tickets', 'Tuispace LLC', '#4a00e0'),
  ('Tui: Bad Astronaut', 'Tuispace LLC', '#00f2fe'),
  ('Kinsta Errors', 'Tuispace LLC', '#10b981'),
  ('Tui: G-Iron', 'Tuispace LLC', '#eab308');

INSERT INTO tickets (project_id, subject, status, priority, ticket_type, created_by, assignee_id) VALUES
  (2, 'Alfio website refresh', 'NEW', 'NORMAL', 'Task', 1, 3),
  (3, 'Bad Astronaut FAQ content', 'COMPLETED', 'NORMAL', 'Feature', 1, 2),
  (5, 'Full update all plugins with vulnerabilities', 'IN_PROGRESS', 'HIGH', 'Bug', 1, 3),
  (4, 'Add Akismet for antispam protection', 'NEW', 'NORMAL', 'Feature', 2, 3);
