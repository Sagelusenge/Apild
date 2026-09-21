const controller = require('./settings.controller');
const { createCrudRouter } = require('../../utils/crudFactory');
const config = require('../../config/entities').settings;
const {z}=require('zod');
const {authenticate}=require('../../middlewares/auth.middleware');
const {requirePermission}=require('../../middlewares/permission.middleware');
const {validate}=require('../../middlewares/validation.middleware');

const router=createCrudRouter(controller,config);
router.post('/test-email',authenticate,requirePermission('settings.manage'),validate(z.object({email:z.string().email()}).strict()),controller.testEmail);
module.exports=router;
