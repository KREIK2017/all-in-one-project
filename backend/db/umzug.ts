import { Umzug, SequelizeStorage } from 'umzug';
import sequelize from '../config/sequelize';

// Рушій міграцій. Лог застосованих міграцій зберігається в таблиці `migrations_meta`.
export const migrator = new Umzug({
  migrations: { glob: ['../migrations/*.{ts,js}', { cwd: __dirname }] },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize, tableName: 'migrations_meta' }),
  logger: console,
});

export type Migration = typeof migrator._types.migration;
