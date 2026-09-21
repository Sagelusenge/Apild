const controller = require('./contact.controller');
const { createCrudRouter } = require('../../utils/crudFactory');
const config = require('../../config/entities').contact;

module.exports = createCrudRouter(controller, config);
