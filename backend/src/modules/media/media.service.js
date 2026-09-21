const repository = require('./media.repository');
const { createService } = require('../../utils/crudFactory');
const config = require('../../config/entities').media;

module.exports = createService(repository, config);
