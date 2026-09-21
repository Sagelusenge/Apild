const repository = require('./project.repository');
const { createService } = require('../../utils/crudFactory');
const config = require('../../config/entities').projects;
const AppError = require('../../utils/AppError');
const { withCalculatedProjectProgress } = require('../../utils/projectProgress');

const base = createService(repository, config);
const exists = (id) => base.get(id);
const withoutManualProgress = (payload) => {
  const data = { ...payload };
  // The percentage is a live calendar calculation, not a form field.
  delete data.progress_percent;
  return data;
};
module.exports = {
  ...base,
  async list(query) {
    const result = await base.list(query);
    return { ...result, rows: result.rows.map((project) => withCalculatedProjectProgress(project)) };
  },
  async get(id) { return withCalculatedProjectProgress(await base.get(id)); },
  async create(payload, user) { return withCalculatedProjectProgress(await base.create(withoutManualProgress(payload), user)); },
  async update(id, payload, user) {
    const data = withoutManualProgress(payload);
    if (!Object.keys(data).length) return withCalculatedProjectProgress(await base.get(id));
    return withCalculatedProjectProgress(await base.update(id, data, user));
  },
  async summary(id) { await exists(id); return withCalculatedProjectProgress(await repository.summary(id)); },
  async members(id) { await exists(id); return repository.members(id); },
  async upsertMember(id, payload) { await exists(id); await repository.upsertMember(id, payload); return repository.members(id); },
  async removeMember(id, userId) { await exists(id); const result = await repository.removeMember(id, userId); if (!result.affectedRows) throw new AppError('Membre introuvable', 404, 'NOT_FOUND'); },
  async domains(id) { await exists(id); return repository.domains(id); },
  async addDomain(id, domainId) { await exists(id); await repository.addDomain(id, domainId); return repository.domains(id); },
  async removeDomain(id, domainId) { await exists(id); const result = await repository.removeDomain(id, domainId); if (!result.affectedRows) throw new AppError('Domaine introuvable sur ce projet', 404, 'NOT_FOUND'); }
};
