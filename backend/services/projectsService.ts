import repo from '../repositories/projectsRepository';
import AppError from '../utils/AppError';

interface ProjectInput {
  name: string;
  client_name?: string | null;
  color?: string;
}

export default {
  list() {
    return repo.findActive();
  },

  async create(data: ProjectInput) {
    if (!data.name || !data.name.trim()) {
      throw new AppError(400, 'Назва проєкту обовʼязкова');
    }
    const id = await repo.create(data);
    return { id, name: data.name, client_name: data.client_name, color: data.color };
  },

  remove(id: number | string) {
    return repo.deleteWithTickets(id);
  },
};
