class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data, options = {}) {
    return await this.model.create(data, options);
  }

  async update(id, data, options = {}) {
    const record = await this.model.findByPk(id);
    if (!record) return null;
    return await record.update(data, options);
  }

  async delete(id, options = {}) {
    const record = await this.model.findByPk(id);
    if (!record) return false;
    await record.destroy(options); // paranoid enabled = soft delete
    return true;
  }

  async hardDelete(id, options = {}) {
    const record = await this.model.findByPk(id);
    if (!record) return false;
    await record.destroy({ ...options, force: true });
    return true;
  }

  async findById(id, include = [], options = {}) {
    return await this.model.findByPk(id, { include, ...options });
  }

  async findOne(where, include = [], options = {}) {
    return await this.model.findOne({ where, include, ...options });
  }

  async findAll(queryOptions = {}) {
    return await this.model.findAll(queryOptions);
  }

  async findAndCountAll(queryOptions = {}) {
    return await this.model.findAndCountAll(queryOptions);
  }

  async bulkCreate(data, options = {}) {
    return await this.model.bulkCreate(data, options);
  }

  async bulkUpdate(where, data, options = {}) {
    return await this.model.update(data, { where, ...options });
  }

  async bulkDelete(where, options = {}) {
    return await this.model.destroy({ where, ...options });
  }
}

module.exports = BaseRepository;
