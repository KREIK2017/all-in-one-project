import { DataTypes } from 'sequelize';
import sequelize from '../config/sequelize';

// Моделі визначені ПІД наявну схему (точні типи/enum'и). Авто-sync НЕ використовуємо.

export const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    avatar_color: { type: DataTypes.STRING(20), defaultValue: '#00f2fe' },
    avatar_url: { type: DataTypes.STRING(255), allowNull: true },
    status: { type: DataTypes.ENUM('online', 'away', 'dnd', 'invisible'), defaultValue: 'online' },
    role: { type: DataTypes.ENUM('admin', 'user'), defaultValue: 'user' },
    handle: { type: DataTypes.STRING(50), allowNull: true, unique: true },
    theme: { type: DataTypes.STRING(20), defaultValue: 'dark' },
    font: { type: DataTypes.STRING(50), defaultValue: 'Inter' },
    created_at: { type: DataTypes.DATE },
  },
  { tableName: 'users' }
);

export const Project = sequelize.define(
  'Project',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    client_name: { type: DataTypes.STRING(150), allowNull: true },
    color: { type: DataTypes.STRING(20), defaultValue: '#00f2fe' },
    is_active: { type: DataTypes.TINYINT, defaultValue: 1 },
    created_at: { type: DataTypes.DATE },
  },
  { tableName: 'projects' }
);

export const Ticket = sequelize.define(
  'Ticket',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    project_id: { type: DataTypes.INTEGER, allowNull: true },
    subject: { type: DataTypes.STRING(255), allowNull: false },
    body: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('NEW', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'), defaultValue: 'NEW' },
    priority: { type: DataTypes.ENUM('NORMAL', 'HIGH'), defaultValue: 'NORMAL' },
    ticket_type: { type: DataTypes.ENUM('Feature', 'Bug', 'Task', 'Support'), defaultValue: 'Task' },
    created_by: { type: DataTypes.INTEGER, allowNull: false },
    assignee_id: { type: DataTypes.INTEGER, allowNull: true },
    is_private: { type: DataTypes.TINYINT, defaultValue: 0 },
    created_at: { type: DataTypes.DATE },
    updated_at: { type: DataTypes.DATE },
  },
  { tableName: 'tickets' }
);

export const Activity = sequelize.define(
  'Activity',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ticket_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    type: {
      type: DataTypes.ENUM(
        'comment',
        'status_change',
        'priority_change',
        'reassign',
        'subject_change',
        'type_change',
        'ticket_updated',
        'time_log'
      ),
      allowNull: false,
    },
    content: { type: DataTypes.TEXT, allowNull: true },
    old_value: { type: DataTypes.STRING(100), allowNull: true },
    new_value: { type: DataTypes.STRING(100), allowNull: true },
    created_at: { type: DataTypes.DATE },
  },
  { tableName: 'activity' }
);

export const TimeEntry = sequelize.define(
  'TimeEntry',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    project_id: { type: DataTypes.INTEGER, allowNull: false },
    ticket_id: { type: DataTypes.INTEGER, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    start_time: { type: DataTypes.DATE, allowNull: false },
    end_time: { type: DataTypes.DATE, allowNull: true },
    duration_minutes: { type: DataTypes.INTEGER, defaultValue: 0 },
    is_manual: { type: DataTypes.TINYINT, defaultValue: 0 },
    edited_by: { type: DataTypes.INTEGER, allowNull: true },
    edited_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE },
  },
  { tableName: 'time_entries' }
);

export const ActiveTimer = sequelize.define(
  'ActiveTimer',
  {
    user_id: { type: DataTypes.INTEGER, primaryKey: true },
    project_id: { type: DataTypes.INTEGER, allowNull: false },
    ticket_id: { type: DataTypes.INTEGER, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    started_at: { type: DataTypes.DATE, allowNull: false },
  },
  { tableName: 'active_timers' }
);

export const Notification = sequelize.define(
  'Notification',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    actor_id: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.ENUM('mention', 'assignment', 'status_update'), allowNull: false },
    target_id: { type: DataTypes.INTEGER, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: true },
    is_read: { type: DataTypes.TINYINT, defaultValue: 0 },
    created_at: { type: DataTypes.DATE },
  },
  { tableName: 'notifications' }
);

export { sequelize };
