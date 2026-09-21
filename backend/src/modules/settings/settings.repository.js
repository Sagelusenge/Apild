const { createRepository } = require('../../utils/crudFactory');
const config = require('../../config/entities').settings;

module.exports = createRepository(config);
