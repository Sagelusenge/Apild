const repository = require('./notification.repository');
const AppError = require('../../utils/AppError');

async function get(id, user) {
  const notification = await repository.findById(id, user);
  if (!notification) throw new AppError('Notification introuvable', 404, 'NOT_FOUND');
  return notification;
}

async function update(id, user, payload) {
  if (!(await repository.markRead(id, user, payload.is_read))) throw new AppError('Notification introuvable', 404, 'NOT_FOUND');
  return get(id, user);
}

async function remove(id, user) {
  if (!(await repository.remove(id, user))) throw new AppError('Notification introuvable', 404, 'NOT_FOUND');
}

module.exports = {
  list: repository.list, get, create: repository.create, createForRoles: repository.createForRoles,
  update, markAllRead: repository.markAllRead, remove
};
