const repository = require('./partner.repository');
const { createService } = require('../../utils/crudFactory');
const config = require('../../config/entities').partners;

module.exports = createService(repository, config);
