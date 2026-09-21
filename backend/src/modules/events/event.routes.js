const express = require('express');
const controller = require('./event.controller');
const { createCrudRouter } = require('../../utils/crudFactory');
const config = require('../../config/entities').events;
const schemas=require('./event.validation');
const {z}=require('zod');
const {authenticate}=require('../../middlewares/auth.middleware');
const {requirePermission}=require('../../middlewares/permission.middleware');
const {validate}=require('../../middlewares/validation.middleware');

const router=express.Router();
router.get('/staff',authenticate,requirePermission('events.manage'),controller.availableStaff);
router.use(createCrudRouter(controller,config,schemas));
router.get('/:id/participants',authenticate,requirePermission('projects.read'),controller.participants);
router.post('/:id/participants',authenticate,requirePermission('events.manage'),validate(z.object({user_id:z.coerce.number().int().positive(),response_status:z.enum(['pending','accepted','declined','tentative']).optional()}).strict()),controller.upsertParticipant);
router.put('/:id/participants',authenticate,requirePermission('events.manage'),validate(z.object({user_ids:z.array(z.coerce.number().int().positive()).max(100)}).strict()),controller.replaceParticipants);
router.delete('/:id/participants/:userId',authenticate,requirePermission('events.manage'),controller.removeParticipant);
module.exports=router;
