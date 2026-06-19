import bcrypt from 'bcryptjs';
import sequelize from '../config/sequelize';
import { User, Project, Ticket } from '../models';

// Демо-дані для свіжої БД. Idempotent: якщо користувачі вже є — нічого не робить.
export async function seed() {
  if ((await User.count()) > 0) {
    console.log('🌱 Seed: дані вже є, пропускаю.');
    return;
  }

  const passwordHash = await bcrypt.hash('demo1234', 10);
  const admin: any = await User.create({
    name: 'Demo Admin',
    email: 'admin@demo.com',
    password_hash: passwordHash,
    role: 'admin',
    handle: 'admin',
  });
  const user: any = await User.create({
    name: 'Demo User',
    email: 'user@demo.com',
    password_hash: passwordHash,
    role: 'user',
    handle: 'demo',
  });

  const p1: any = await Project.create({ name: 'Website Redesign', client_name: 'ACME Inc', color: '#8b5cf6' });
  await Project.create({ name: 'Internal Tools', color: '#00f2fe' });

  await Ticket.create({
    subject: 'Set up CI pipeline',
    project_id: p1.id,
    created_by: admin.id,
    assignee_id: user.id,
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    ticket_type: 'Task',
  });

  console.log('🌱 Seed: створено демо-дані. Вхід: admin@demo.com / demo1234');
}

// Прямий запуск: tsx db/seed.ts
if (require.main === module) {
  seed()
    .then(() => sequelize.close())
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
