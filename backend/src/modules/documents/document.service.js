const AppError = require('../../utils/AppError');
const repository = require('./document.repository');

const allowedScopes = new Set(['private', 'team', 'selected']);

function canManage(user) {
  return user?.roles?.includes('admin') || user?.permissions?.includes('documents.manage');
}

function recipients(value) {
  if (Array.isArray(value)) return [...new Set(value.map(Number).filter(Number.isFinite))];
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return [...new Set(parsed.map(Number).filter(Number.isFinite))];
  } catch (_error) {
    return [...new Set(String(value).split(',').map(Number).filter(Number.isFinite))];
  }
  return [];
}

function sharingData(payload, partial = false) {
  const data = { ...payload };
  const recipientIds = data.recipient_ids === undefined && partial ? undefined : recipients(data.recipient_ids);
  delete data.recipient_ids;
  if (!partial && !data.share_scope) data.share_scope = 'private';
  if (data.share_scope !== undefined && !allowedScopes.has(data.share_scope)) {
    throw new AppError('Mode de partage invalide', 422, 'INVALID_SHARE_SCOPE');
  }
  if (data.share_scope === 'selected' && !recipientIds?.length) {
    throw new AppError('Choisissez au moins une personne avec qui partager ce fichier', 422, 'RECIPIENT_REQUIRED');
  }
  return { data, recipientIds };
}

module.exports = {
  list: (query, user) => repository.findAllForUser(query, user, canManage(user)),
  async get(id, user) {
    const item = await repository.findByIdForUser(id, user, canManage(user));
    if (!item) throw new AppError('document introuvable', 404, 'NOT_FOUND');
    return item;
  },
  async create(payload, user) {
    const { data, recipientIds } = sharingData(payload);
    data.uploaded_by = user.id;
    return repository.createWithRecipients(data, recipientIds, user);
  },
  async update(id, payload, user) {
    const { data, recipientIds } = sharingData(payload, true);
    const item = await repository.updateWithRecipients(id, data, recipientIds, user);
    if (!item) throw new AppError('document introuvable', 404, 'NOT_FOUND');
    return item;
  },
  async remove(id) {
    if (!(await repository.remove(id))) throw new AppError('document introuvable', 404, 'NOT_FOUND');
  }
};
