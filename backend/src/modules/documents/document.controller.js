const service = require('./document.service');
const { createController } = require('../../utils/crudFactory');
const config = require('../../config/entities').documents;
const asyncHandler=require('../../utils/asyncHandler');
const {created,success}=require('../../utils/response');
const fileService=require('../../services/file.service');

const controller=createController(service,config);
controller.list=asyncHandler(async(req,res)=>{
 const result=await service.list(req.query,req.user);
 return success(res,result.rows,'Liste chargee',200,result.meta);
});
controller.get=asyncHandler(async(req,res)=> success(res,await service.get(req.params.id,req.user)));
controller.upload=asyncHandler(async(req,res)=>{
 if(!req.file) return res.status(422).json({success:false,error:{code:'FILE_REQUIRED',message:'Fichier requis'}});
 const relative=fileService.uploadRelativePath('documents',req.file);
 try {
  await fileService.persistUpload(req.file,relative);
  const item=await service.create({project_id:req.body.project_id||null,task_id:req.body.task_id||null,title:req.body.title||req.file.originalname,description:req.body.description||null,document_type:req.body.document_type||'other',original_name:req.file.originalname,stored_name:req.file.filename,file_path:relative,mime_type:req.file.mimetype,file_size:req.file.size,version_number:req.body.version_number||1,is_public:String(req.body.is_public)==='true',share_scope:req.body.share_scope||'private',recipient_ids:req.body.recipient_ids},req.user);
  return created(res,item,'Document televerse');
 } catch(error) {
  await fileService.remove(relative).catch(()=>undefined);
  throw error;
 }
});
controller.download=asyncHandler(async(req,res)=>{
 const document=await service.get(req.params.id,req.user);
 const file=await fileService.getFile(document.file_path);
 if(file.path) return res.download(file.path,document.original_name);
 res.type(file.contentType||document.mime_type||'application/octet-stream');
 res.attachment(document.original_name);
 if(file.contentLength) res.setHeader('content-length',String(file.contentLength));
 return file.stream.pipe(res);
});
module.exports=controller;
