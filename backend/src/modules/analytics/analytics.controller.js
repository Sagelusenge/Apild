const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const service = require('./analytics.service');

const track = asyncHandler(async (request, response) => (
  success(response, await service.track(request.body), 'Mesure enregistree', 202)
));

module.exports = { track };
