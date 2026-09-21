const controller = require('./partner.controller');
const { createCrudRouter } = require('../../utils/crudFactory');
const config = require('../../config/entities').partners;

module.exports = createCrudRouter(controller, config);
