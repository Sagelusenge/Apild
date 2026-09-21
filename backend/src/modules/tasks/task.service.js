const repository = require('./task.repository');
const { createService } = require('../../utils/crudFactory');
const config = require('../../config/entities').tasks;
const AppError = require('../../utils/AppError');
const { isStaffTaskScope } = require('./task.scope');

const base = createService(repository, config);
const STAFF_UPDATABLE_FIELDS = new Set(['status', 'progress_percent', 'actual_hours']);

function assertStaffUpdateFields(payload) {
  const forbiddenFields = Object.keys(payload).filter((field) => !STAFF_UPDATABLE_FIELDS.has(field));
  if (forbiddenFields.length) {
    throw new AppError(
      'Le personnel peut uniquement mettre a jour le statut, la progression et les heures effectuees',
      403,
      'TASK_FIELD_FORBIDDEN',
      { fields: forbiddenFields }
    );
  }
}

async function listForUser(query, user) {
  if (isStaffTaskScope(user)) return repository.findAllAssignedTo(user.id, query);
  return base.list(query);
}

async function getForUser(id, user) {
  if (!isStaffTaskScope(user)) return base.get(id);
  const item = await repository.findByIdAssignedTo(id, user.id);
  if (!item) throw new AppError(`${config.entityName} introuvable`, 404, 'NOT_FOUND');
  return item;
}

async function updateForUser(id, payload, user) {
  if (!isStaffTaskScope(user)) return base.update(id, payload, user);
  await getForUser(id, user);
  assertStaffUpdateFields(payload);
  const item = await repository.updateAssignedTo(id, payload, user.id);
  if (!item) throw new AppError(`${config.entityName} introuvable`, 404, 'NOT_FOUND');
  return item;
}

module.exports = {
  ...base,
  listForUser,
  getForUser,
  updateForUser,
  async assignees(id, user) { await getForUser(id, user); return repository.assignees(id); },
  async assign(id,userId,actorId) { await base.get(id); await repository.assign(id,userId,actorId); return repository.assignees(id); },
  async unassign(id,userId) { await base.get(id); const r=await repository.unassign(id,userId); if(!r.affectedRows) throw new AppError('Affectation introuvable',404,'NOT_FOUND'); },
  async comments(id, user) { await getForUser(id, user); return repository.comments(id); },
  async addComment(id,userId,text, user) { await getForUser(id, user); return repository.addComment(id,userId,text); },
  async updateComment(commentId,text, user) {
    const updated = isStaffTaskScope(user)
      ? await repository.updateCommentForAssignee(commentId, text, user.id)
      : await repository.updateComment(commentId, text);
    if (!updated) throw new AppError('Commentaire introuvable',404,'NOT_FOUND');
  },
  async removeComment(commentId, user) {
    const removed = isStaffTaskScope(user)
      ? await repository.removeCommentForAssignee(commentId, user.id)
      : await repository.removeComment(commentId);
    if (!removed) throw new AppError('Commentaire introuvable',404,'NOT_FOUND');
  }
};
