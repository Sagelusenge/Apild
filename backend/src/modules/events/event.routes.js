const express = require('express');
const controller = require('./event.controller');
const { createCrudRouter } = require('../../utils/crudFactory');
const config = require('../../config/entities').events;
const schemas=require('./event.validation');
const {z}=require('zod');
const {authenticate}=require('../../middlewares/auth.middleware');
const {requirePermission}=require('../../middlewares/permission.middleware');
const {validate}=require('../../middlewares/validation.middleware');
const db=require('../../config/database');
const asyncHandler=require('../../utils/asyncHandler');
const AppError=require('../../utils/AppError');
const {success}=require('../../utils/response');

const router=express.Router();
router.get('/staff',authenticate,requirePermission('events.manage'),controller.availableStaff);
router.get('/calendar',authenticate,requirePermission('projects.read'),asyncHandler(async(req,res)=>{
 const {from,to}=req.query;
 const validDate=(value)=>/^\d{4}-\d{2}-\d{2}$/.test(String(value||''))&&!Number.isNaN(new Date(`${value}T12:00:00`).getTime());
 if(!validDate(from)||!validDate(to)||from>to)throw new AppError('Période du calendrier invalide',422,'INVALID_CALENDAR_RANGE');
 const days=(new Date(`${to}T12:00:00`)-new Date(`${from}T12:00:00`))/86400000;
 if(days>62)throw new AppError('La période du calendrier ne peut pas dépasser 63 jours',422,'CALENDAR_RANGE_TOO_LARGE');
 const rows=await db.query(`SELECT id,title,description,starts_at,ends_at,location,meeting_url,event_type,status
   FROM events WHERE deleted_at IS NULL AND starts_at>=? AND starts_at<DATE_ADD(?,INTERVAL 1 DAY)
   ORDER BY starts_at ASC`,[from,to]);
 return success(res,rows,'Activités du calendrier chargées');
}));
router.use(createCrudRouter(controller,config,schemas));
router.get('/:id/participants',authenticate,requirePermission('projects.read'),controller.participants);
router.post('/:id/participants',authenticate,requirePermission('events.manage'),validate(z.object({user_id:z.coerce.number().int().positive(),response_status:z.enum(['pending','accepted','declined','tentative']).optional()}).strict()),controller.upsertParticipant);
router.put('/:id/participants',authenticate,requirePermission('events.manage'),validate(z.object({user_ids:z.array(z.coerce.number().int().positive()).max(100)}).strict()),controller.replaceParticipants);
router.delete('/:id/participants/:userId',authenticate,requirePermission('events.manage'),controller.removeParticipant);
module.exports=router;
