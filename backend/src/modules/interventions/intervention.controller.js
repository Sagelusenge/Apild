const service = require('./intervention.service');
const { createController } = require('../../utils/crudFactory');
const config = require('../../config/entities').interventions;

const controller=createController(service,config);
controller.domains=createController(service.domains,{entityName:'Domaine'});
module.exports=controller;
