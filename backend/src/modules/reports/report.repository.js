const { createRepository } = require('../../utils/crudFactory');
const config = require('../../config/entities').reports;

module.exports = createRepository(config);
