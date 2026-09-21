const service = require('./user.service');
const asyncHandler = require('../../utils/asyncHandler');
const { success, created } = require('../../utils/response');

module.exports = {
  list: asyncHandler(async (request, response) => {
    const result = await service.list(request.query);
    return success(response, result.rows, 'Utilisateurs charges', 200, result.meta);
  }),
  get: asyncHandler(async (request, response) => success(response, await service.get(request.params.id))),
  create: asyncHandler(async (request, response) => created(response, await service.create(request.body, request.user), 'Utilisateur cree')),
  update: asyncHandler(async (request, response) => success(response, await service.update(request.params.id, request.body, request.user), 'Utilisateur modifie')),
  block: asyncHandler(async (request, response) => success(response, await service.block(request.params.id, request.user), 'Utilisateur bloque')),
  unblock: asyncHandler(async (request, response) => success(response, await service.unblock(request.params.id, request.user), 'Utilisateur debloque')),
  remove: asyncHandler(async (request, response) => {
    await service.remove(request.params.id, request.user);
    return response.status(204).send();
  })
};
