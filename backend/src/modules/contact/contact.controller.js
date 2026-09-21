const service = require('./contact.service');
const { createController } = require('../../utils/crudFactory');
const config = require('../../config/entities').contact;

module.exports = createController(service, config);
