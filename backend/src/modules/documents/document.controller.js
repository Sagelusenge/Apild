const service = require('./document.service');
const { createController } = require('../../utils/crudFactory');
const config = require('../../config/entities').documents;
const path=require('path');
const asyncHandler=require('../../utils/asyncHandler');
const {created}=require('../../utils/response');
const fileService=require('../../services/file.service');

const controller=createController(service,config);
controller.upload=asyncHandler(async(req,res)=>{
 if(!req.file) return res.status(422).json({success:false,error:{code:'FILE_REQUIRED',message:'Fichier requis'}});
 const relative=path.relative(path.resolve(__dirname,'../../..'),req.file.path).replace(/\\/g,'/');
 try {
  const item=await service.create({project_id:req.body.project_id||null,task_id:req.body.task_id||null,title:req.body.title||req.file.originalname,description:req.body.description||null,document_type:req.body.document_type||'other',original_name:req.file.originalname,stored_name:req.file.filename,file_path:relative,mime_type:req.file.mimetype,file_size:req.file.size,version_number:req.body.version_number||1,is_public:String(req.body.is_public)==='true'},req.user);
  return created(res,item,'Document televerse');
 } catch(error) {
  await fileService.remove(relative).catch(()=>undefined);
  throw error;
 }
});
controller.download=asyncHandler(async(req,res)=>{
 const document=await service.get(req.params.id);
 const absolutePath=fileService.resolveUploadPath(document.file_path);
 return res.download(absolutePath,document.original_name);
});
module.exports=controller;
