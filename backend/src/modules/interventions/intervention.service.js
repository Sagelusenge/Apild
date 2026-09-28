const repository = require('./intervention.repository');
const { createService } = require('../../utils/crudFactory');
const config = require('../../config/entities').interventions;
const AppError = require('../../utils/AppError');

const base=createService(repository,config);
const domains=createService(repository.domains,{
 entityName:'Domaine', autoCodeField:'code', autoCodeSource:'name', autoCodePrefix:'domaine'
});

async function update(id, payload, user) {
 const current = await base.get(id);
 if (current.status === 'completed') {
  throw new AppError('Cette intervention est terminée et ne peut plus être modifiée.', 409, 'COMPLETED_RESOURCE_LOCKED');
 }
 return base.update(id, payload, user);
}

module.exports={...base,update,domains};
