const controller = require('./media.controller');
const { createCrudRouter } = require('../../utils/crudFactory');
const config = require('../../config/entities').media;
const {authenticate}=require('../../middlewares/auth.middleware');
const {requirePermission}=require('../../middlewares/permission.middleware');
const {uploadImage,validateUploadedFile}=require('../../middlewares/upload.middleware');

const router=createCrudRouter(controller,config);
router.post('/upload',authenticate,requirePermission('media.manage'),uploadImage,validateUploadedFile,controller.upload);
module.exports=router;
