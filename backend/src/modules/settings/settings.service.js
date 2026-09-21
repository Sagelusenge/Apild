const repository = require('./settings.repository');
const { createService } = require('../../utils/crudFactory');
const config = require('../../config/entities').settings;

module.exports = createService(repository, config);
