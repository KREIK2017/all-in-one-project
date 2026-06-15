const repo = require('../repositories/projectsRepository');
const AppError = require('../utils/AppError');

module.exports = {
  list() {
    return repo.findActive();
  },

  async create(data) {
    if (!data.name || !data.name.trim()) {
      throw new AppError(400, 'Назва проєкту обовʼязкова');
    }
    const id = await repo.create(data);
    return { id, name: data.name, client_name: data.client_name, color: data.color };
  },

  remove(id) {
    return repo.softDelete(id);
  },
};
