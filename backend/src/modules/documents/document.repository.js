const { createRepository } = require('../../utils/crudFactory');
const config = require('../../config/entities').documents;

module.exports = createRepository(config);
