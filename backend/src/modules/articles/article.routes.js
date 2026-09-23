const controller = require('./article.controller');
const { createCrudRouter } = require('../../utils/crudFactory');
const config = require('../../config/entities').articles;
const schemas=require('./article.validation');
const express=require('express');
const {optionalAuthenticate,authenticate}=require('../../middlewares/auth.middleware');
const {requirePermission}=require('../../middlewares/permission.middleware');
const {validate,validateCrudBody}=require('../../middlewares/validation.middleware');
const { publicInteractionLimiter } = require('../../middlewares/rateLimit.middleware');
const engagementSchemas = require('./article.engagement.validation');

const router=express.Router();
const categoryConfig={fields:['name','slug','description'],required:['name']};
router.get('/categories',optionalAuthenticate,controller.categories.list);
router.get('/categories/:id',optionalAuthenticate,controller.categories.get);
router.post('/categories',authenticate,requirePermission('articles.manage'),validateCrudBody(categoryConfig),controller.categories.create);
router.put('/categories/:id',authenticate,requirePermission('articles.manage'),validateCrudBody(categoryConfig),controller.categories.update);
router.patch('/categories/:id',authenticate,requirePermission('articles.manage'),validateCrudBody(categoryConfig,true),controller.categories.update);
router.delete('/categories/:id',authenticate,requirePermission('articles.manage'),controller.categories.remove);
router.get('/:id/engagement', controller.engagement);
router.get('/:id/comments', controller.comments);
router.get('/:id/attachments', controller.attachments);
router.post('/:id/comments', publicInteractionLimiter, validate(engagementSchemas.comment), controller.createComment);
router.post('/:id/like', publicInteractionLimiter, validate(engagementSchemas.reaction), controller.toggleLike);
router.post('/:id/share', publicInteractionLimiter, validate(engagementSchemas.share), controller.share);
// Taking a publication offline is intentionally distinct from deletion: the
// article remains available to authorised editors and keeps its audit trail.
router.patch('/:id/unpublish',authenticate,requirePermission('articles.manage'),controller.unpublish);
router.use('/',createCrudRouter(controller,config,schemas));
module.exports=router;
