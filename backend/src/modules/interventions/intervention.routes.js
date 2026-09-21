const controller = require('./intervention.controller');
const { createCrudRouter } = require('../../utils/crudFactory');
const config = require('../../config/entities').interventions;
const express=require('express');
const {authenticate}=require('../../middlewares/auth.middleware');
const {requirePermission}=require('../../middlewares/permission.middleware');
const {validateCrudBody}=require('../../middlewares/validation.middleware');

const router=express.Router();
const domainConfig={fields:['code','name','description','color','is_active'],required:['name']};
router.get('/domains',authenticate,requirePermission('projects.read'),controller.domains.list);
router.get('/domains/:id',authenticate,requirePermission('projects.read'),controller.domains.get);
router.post('/domains',authenticate,requirePermission('interventions.manage'),validateCrudBody(domainConfig),controller.domains.create);
router.put('/domains/:id',authenticate,requirePermission('interventions.manage'),validateCrudBody(domainConfig),controller.domains.update);
router.patch('/domains/:id',authenticate,requirePermission('interventions.manage'),validateCrudBody(domainConfig,true),controller.domains.update);
router.delete('/domains/:id',authenticate,requirePermission('interventions.manage'),controller.domains.remove);
router.use('/',createCrudRouter(controller,config));
module.exports=router;
