import { Transaction } from 'sequelize';
import sequelize from '../config/sequelize';

// Виконує fn(t) у транзакції Sequelize: авто-commit при успіху, авто-rollback при помилці.
export default function withTransaction<T>(fn: (t: Transaction) => Promise<T>): Promise<T> {
  return sequelize.transaction(fn);
}
