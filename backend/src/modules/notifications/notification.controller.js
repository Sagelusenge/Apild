const service = require('./notification.service');
const asyncHandler = require('../../utils/asyncHandler');
const { success, created } = require('../../utils/response');

module.exports = {
  list: asyncHandler(async (request, response) => {
    const result = await service.list(request.user, request.query);
    return success(response, result.rows, 'Notifications chargees', 200, result.meta);
  }),
  get: asyncHandler(async (request, response) => success(response, await service.get(request.params.id, request.user))),
  create: asyncHandler(async (request, response) => created(response, await service.create(request.body), 'Notification creee')),
  update: asyncHandler(async (request, response) => success(response, await service.update(request.params.id, request.user, request.body), 'Notification modifiee')),
  markAllRead: asyncHandler(async (request, response) => {
    await service.markAllRead(request.user.id);
    return success(response, null, 'Toutes les notifications sont lues');
  }),
  remove: asyncHandler(async (request, response) => {
    await service.remove(request.params.id, request.user);
    return response.status(204).send();
  })
};
