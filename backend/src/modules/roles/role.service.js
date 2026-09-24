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
  void id;
  throw new AppError('Les trois roles APILD ne peuvent pas etre supprimes.', 409, 'FIXED_ROLES');
}

async function create() {
  throw new AppError('Les roles APILD sont limites a admin, communication et RH.', 409, 'FIXED_ROLES');
}

async function update(id, payload, actor) {
  await get(id);
  const { name, description } = payload;
  if (name === undefined && description === undefined) return get(id);
  await base.update(id, { name, description }, actor);
  return get(id);
}

module.exports = { ...base, get, create, update, setPermissions, remove, listPermissions: repository.listPermissions };
