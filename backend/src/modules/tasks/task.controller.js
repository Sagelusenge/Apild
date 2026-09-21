const service = require('./task.service');
const { createController } = require('../../utils/crudFactory');
const config = require('../../config/entities').tasks;
const asyncHandler = require('../../utils/asyncHandler');
const { success, created } = require('../../utils/response');

const controller = createController(service, config);
controller.list=asyncHandler(async(req,res)=>{
  const result = await service.listForUser(req.query, req.user);
  return success(res, result.rows, 'Liste chargee', 200, result.meta);
});
controller.get=asyncHandler(async(req,res)=>success(res,await service.getForUser(req.params.id,req.user)));
controller.update=asyncHandler(async(req,res)=>success(res,await service.updateForUser(req.params.id,req.body,req.user),`${config.entityName} modifie`));
controller.assignees=asyncHandler(async(req,res)=>success(res,await service.assignees(req.params.id,req.user)));
controller.assign=asyncHandler(async(req,res)=>success(res,await service.assign(req.params.id,req.body.user_id,req.user.id),'Utilisateur assigne'));
controller.unassign=asyncHandler(async(req,res)=>{await service.unassign(req.params.id,req.params.userId);res.status(204).send();});
controller.comments=asyncHandler(async(req,res)=>success(res,await service.comments(req.params.id,req.user)));
controller.addComment=asyncHandler(async(req,res)=>created(res,await service.addComment(req.params.id,req.user.id,req.body.comment_text,req.user),'Commentaire ajoute'));
controller.updateComment=asyncHandler(async(req,res)=>{await service.updateComment(req.params.commentId,req.body.comment_text,req.user);success(res,null,'Commentaire modifie');});
controller.removeComment=asyncHandler(async(req,res)=>{await service.removeComment(req.params.commentId,req.user);res.status(204).send();});
module.exports=controller;
