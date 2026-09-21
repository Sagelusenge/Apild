const service = require('./partner.service');
const { createController } = require('../../utils/crudFactory');
const config = require('../../config/entities').partners;

module.exports = createController(service, config);
