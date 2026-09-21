const repository = require('./role.repository');
const { createService } = require('../../utils/crudFactory');
const AppError = require('../../utils/AppError');

const base = createService(repository, {
  entityName: 'Role', autoCodeField: 'code', autoCodeSource: 'name', autoCodePrefix: 'role'
});

async function get(id) {
  const role = await base.get(id);
  role.permissions = await repository.getPermissions(id);
  return role;
}

async function setPermissions(id, permissionIds) {
  await base.get(id);
  await repository.setPermissions(id, permissionIds);
  return get(id);
}

async function remove(id) {
  const role = await base.get(id);
  if (role.is_system) throw new AppError('Un role systeme ne peut pas etre supprime', 409, 'SYSTEM_ROLE');
  return base.remove(id);
}

module.exports = { ...base, get, setPermissions, remove, listPermissions: repository.listPermissions };
