const { createRepository } = require('../../utils/crudFactory');
const config = require('../../config/entities').media;

module.exports = createRepository(config);
