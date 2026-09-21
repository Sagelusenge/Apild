const service = require('./statistics.service');
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');

module.exports = {
  overview: asyncHandler(async (_request, response) => success(response, await service.overview())),
  projects: asyncHandler(async (_request, response) => success(response, await service.projects())),
  communication: asyncHandler(async (_request, response) => success(response, await service.communication())),
  communicationDashboard: asyncHandler(async (_request, response) => success(response, await service.communicationDashboard())),
  newsletters: asyncHandler(async (_request, response) => success(response, await service.newsletters()))
};
