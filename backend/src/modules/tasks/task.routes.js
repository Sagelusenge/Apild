const express = require('express');
const controller = require('./task.controller');
const config = require('../../config/entities').tasks;
const schemas=require('./task.validation');
const { z } = require('zod');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requirePermission } = require('../../middlewares/permission.middleware');
const { validate } = require('../../middlewares/validation.middleware');

const router=express.Router();

router.get('/',authenticate,requirePermission(config.readPermission),controller.list);
router.get('/:id',authenticate,requirePermission(config.readPermission),controller.get);
router.post('/',authenticate,requirePermission(config.createPermission),validate(schemas.create),controller.create);
router.put('/:id',authenticate,requirePermission(config.updatePermission),validate(schemas.update),controller.update);
router.patch('/:id',authenticate,requirePermission(config.updatePermission),validate(schemas.update),controller.update);
router.delete('/:id',authenticate,requirePermission(config.deletePermission),controller.remove);
router.get('/:id/assignees',authenticate,requirePermission('tasks.read'),controller.assignees);
router.post('/:id/assignees',authenticate,requirePermission('tasks.assign'),validate(z.object({user_id:z.coerce.number().int().positive()}).strict()),controller.assign);
router.delete('/:id/assignees/:userId',authenticate,requirePermission('tasks.assign'),controller.unassign);
router.get('/:id/comments',authenticate,requirePermission('tasks.read'),controller.comments);
router.post('/:id/comments',authenticate,requirePermission('tasks.update'),validate(z.object({comment_text:z.string().min(1)}).strict()),controller.addComment);
router.patch('/:id/comments/:commentId',authenticate,requirePermission('tasks.update'),validate(z.object({comment_text:z.string().min(1)}).strict()),controller.updateComment);
router.delete('/:id/comments/:commentId',authenticate,requirePermission('tasks.update'),controller.removeComment);
module.exports=router;
