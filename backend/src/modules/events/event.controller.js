const service = require('./event.service');
const { createController } = require('../../utils/crudFactory');
const config = require('../../config/entities').events;
const asyncHandler=require('../../utils/asyncHandler');
const {success}=require('../../utils/response');

const controller=createController(service,config);
controller.list=asyncHandler(async(req,res)=>{const result=await service.listForUser(req.query,req.user);return success(res,result.rows,'Liste chargee',200,result.meta);});
controller.get=asyncHandler(async(req,res)=>success(res,await service.getForUser(req.params.id,req.user)));
controller.availableStaff=asyncHandler(async(_req,res)=>success(res,await service.availableStaff()));
controller.participants=asyncHandler(async(req,res)=>success(res,await service.participants(req.params.id,req.user)));
controller.upsertParticipant=asyncHandler(async(req,res)=>success(res,await service.upsertParticipant(req.params.id,req.body),'Participant enregistre'));
controller.replaceParticipants=asyncHandler(async(req,res)=>success(res,await service.replaceParticipants(req.params.id,req.body),'Participants mis a jour'));
controller.removeParticipant=asyncHandler(async(req,res)=>{await service.removeParticipant(req.params.id,req.params.userId);res.status(204).send();});
module.exports=controller;
