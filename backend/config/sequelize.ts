import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: 'mysql',
    logging: false,
    // Наші таблиці мають свої snake_case часові колонки й не всі мають updated_at,
    // тож вимикаємо авто-таймстемпи Sequelize і фіксуємо імена таблиць.
    define: { timestamps: false, freezeTableName: true },
  }
);

export default sequelize;
