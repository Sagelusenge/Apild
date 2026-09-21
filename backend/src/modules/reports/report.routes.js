const controller = require('./report.controller');
const { createCrudRouter } = require('../../utils/crudFactory');
const config = require('../../config/entities').reports;
const {authenticate}=require('../../middlewares/auth.middleware');
const {requirePermission}=require('../../middlewares/permission.middleware');

const router=createCrudRouter(controller,config);
router.get('/:id/pdf',authenticate,requirePermission('reports.read'),controller.pdf);
module.exports=router;
