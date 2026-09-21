const repository = require('./report.repository');
const { createService } = require('../../utils/crudFactory');
const config = require('../../config/entities').reports;

module.exports = createService(repository, config);
