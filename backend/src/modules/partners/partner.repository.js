const { createRepository } = require('../../utils/crudFactory');
const config = require('../../config/entities').partners;

module.exports = createRepository(config);
