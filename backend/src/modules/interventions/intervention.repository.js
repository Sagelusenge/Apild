const { createRepository } = require('../../utils/crudFactory');
const config = require('../../config/entities').interventions;

const repository=createRepository(config);
repository.domains=createRepository({table:'intervention_domains',entityName:'domaine',softDelete:false,fields:['code','name','description','color','is_active'],search:['code','name','description'],filters:['is_active']});
module.exports=repository;
