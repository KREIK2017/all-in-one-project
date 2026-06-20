import type { Migration } from '../db/umzug';

// Додаємо значення 'offline' до enum users.status (для presence-логіки).
export const up: Migration = async ({ context: qi }) => {
  await qi.sequelize.query(
    "ALTER TABLE users MODIFY COLUMN status ENUM('online','away','dnd','invisible','offline') DEFAULT 'online'"
  );
};

export const down: Migration = async ({ context: qi }) => {
  // Прибрати значення, якого не буде у старому enum, щоб ALTER не обрізав дані
  await qi.sequelize.query("UPDATE users SET status='invisible' WHERE status='offline'");
  await qi.sequelize.query(
    "ALTER TABLE users MODIFY COLUMN status ENUM('online','away','dnd','invisible') DEFAULT 'online'"
  );
};
