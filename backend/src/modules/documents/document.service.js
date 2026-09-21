const repository = require('./document.repository');
const { createService } = require('../../utils/crudFactory');
const config = require('../../config/entities').documents;

module.exports = createService(repository, config);
