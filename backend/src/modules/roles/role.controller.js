const service = require('./role.service');
const { createController } = require('../../utils/crudFactory');
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');

const controller = createController(service, { entityName: 'Role' });
controller.permissions = asyncHandler(async (_request, response) => success(response, await service.listPermissions()));
controller.setPermissions = asyncHandler(async (request, response) => success(response, await service.setPermissions(request.params.id, request.body.permission_ids), 'Permissions modifiees'));

module.exports = controller;
