const repository = require('./intervention.repository');
const { createService } = require('../../utils/crudFactory');
const config = require('../../config/entities').interventions;

const base=createService(repository,config);
const domains=createService(repository.domains,{
 entityName:'Domaine', autoCodeField:'code', autoCodeSource:'name', autoCodePrefix:'domaine'
});
module.exports={...base,domains};
