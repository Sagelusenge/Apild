const service = require('./newsletter.service');
const { createController } = require('../../utils/crudFactory');
const config = require('../../config/entities').newsletters;
const asyncHandler=require('../../utils/asyncHandler');
const {success,created}=require('../../utils/response');

const controller=createController(service,config);
controller.subscribers=createController(service.subscribers,{entityName:'Abonne'});
controller.subscribe=asyncHandler(async(req,res)=>created(res,await service.subscribe(req.body),'Abonnement enregistre'));
controller.unsubscribe=asyncHandler(async(req,res)=>success(res,await service.unsubscribe(req.body.token),'Désabonnement enregistré'));
controller.send=asyncHandler(async(req,res)=>success(res,await service.send(req.params.id),'Newsletter traitee'));
module.exports=controller;
