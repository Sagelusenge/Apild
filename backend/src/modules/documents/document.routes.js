const controller = require('./document.controller');
const { createCrudRouter } = require('../../utils/crudFactory');
const config = require('../../config/entities').documents;
const {authenticate}=require('../../middlewares/auth.middleware');
const {requirePermission}=require('../../middlewares/permission.middleware');
const {uploadDocument,validateUploadedFile}=require('../../middlewares/upload.middleware');

const router=createCrudRouter(controller,config);
router.post('/upload',authenticate,requirePermission('documents.manage'),uploadDocument,validateUploadedFile,controller.upload);
router.get('/:id/download',authenticate,requirePermission('documents.read'),controller.download);
module.exports=router;
