const { createRepository } = require('../../utils/crudFactory');
const config = require('../../config/entities').contact;

module.exports = createRepository(config);
