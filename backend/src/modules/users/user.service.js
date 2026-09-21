const bcrypt = require('bcryptjs');
const env = require('../../config/env');
const repository = require('./user.repository');
const AppError = require('../../utils/AppError');
const emailQueueService = require('../../services/operationalEmailQueue.service');
const logger = require('../../utils/logger');

async function get(id) {
  const user = await repository.findById(id);
  if (!user) throw new AppError('Utilisateur introuvable', 404, 'NOT_FOUND');
  user.must_change_password = Boolean(user.must_change_password);
  user.roles = await repository.getRoles(id);
  return user;
}

function hasAdminRole(actor) {
  return Boolean(actor?.roles?.includes('admin'));
}

function assertAdminRole(actor) {
  if (!hasAdminRole(actor)) {
    throw new AppError('Cette action est reservee aux administrateurs', 403, 'ADMIN_ROLE_REQUIRED');
  }
}

function assertNotSelf(id, actor) {
  if (String(id) === String(actor?.id)) {
    throw new AppError('Vous ne pouvez pas modifier le statut de votre propre compte', 409, 'SELF_BLOCK');
  }
}

async function create(payload, actor) {
  assertAdminRole(actor);
  if (await repository.findByEmail(payload.email)) throw new AppError('Cette adresse email est deja utilisee', 409, 'EMAIL_EXISTS');
  const { password, role_ids = [], ...data } = payload;
  if (role_ids.length) assertAdminRole(actor);
  data.password_hash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
  data.must_change_password = true;
  const user = await repository.create(data);
  if (role_ids.length) await repository.setRoles(user.id, role_ids, actor.id);
  const createdUser = await get(user.id);
  // Delivery is deliberately best-effort: a temporary SMTP outage must never
  // make the administrator recreate the account.  The queue preserves a
  // retryable, auditable record when it is available.
  if (createdUser.status === 'active') {
    try {
      await emailQueueService.queueAccountInvitation(createdUser);
    } catch (error) {
      logger.warn({ err: error, userId: createdUser.id }, 'Invitation de nouvel acteur non mise en file');
    }
  }
  return createdUser;
}

async function update(id, payload, actor) {
  await get(id);
  const { password, role_ids, status, ...data } = payload;
  if (role_ids !== undefined) assertAdminRole(actor);
  if (password) assertAdminRole(actor);
  if (status !== undefined) {
    assertAdminRole(actor);
    if (status !== 'active') assertNotSelf(id, actor);
  }
  if (password) {
    await repository.setPassword(id, await bcrypt.hash(password, env.BCRYPT_ROUNDS), { mustChangePassword: true });
  }
  if (Object.keys(data).length) await repository.update(id, data);
  if (role_ids) await repository.setRoles(id, role_ids, actor.id);
  if (status !== undefined) {
    const updated = await repository.setStatus(id, status, { revokeSessions: status !== 'active' });
    if (!updated) throw new AppError('Utilisateur introuvable', 404, 'NOT_FOUND');
  }
  return get(id);
}

async function setAccessStatus(id, status, actor) {
  assertAdminRole(actor);
  assertNotSelf(id, actor);
  const user = await get(id);
  if (user.status !== status) {
    const updated = await repository.setStatus(id, status, { revokeSessions: status === 'suspended' });
    if (!updated) throw new AppError('Utilisateur introuvable', 404, 'NOT_FOUND');
  }
  return get(id);
}

function block(id, actor) {
  return setAccessStatus(id, 'suspended', actor);
}

function unblock(id, actor) {
  return setAccessStatus(id, 'active', actor);
}

async function remove(id, actor) {
  if (String(id) === String(actor.id)) throw new AppError('Vous ne pouvez pas archiver votre propre compte', 409, 'SELF_DELETE');
  if (!(await repository.remove(id))) throw new AppError('Utilisateur introuvable', 404, 'NOT_FOUND');
}

async function list(query) {
  const result = await repository.findAll(query);
  return {
    ...result,
    rows: result.rows.map((user) => ({ ...user, must_change_password: Boolean(user.must_change_password) }))
  };
}

module.exports = { list, get, create, update, block, unblock, remove };
