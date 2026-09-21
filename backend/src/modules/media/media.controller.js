const service = require('./media.service');
const { createController } = require('../../utils/crudFactory');
const config = require('../../config/entities').media;
const path=require('path');
const asyncHandler=require('../../utils/asyncHandler');
const {created}=require('../../utils/response');
const fileService=require('../../services/file.service');

const controller=createController(service,config);
controller.upload=asyncHandler(async(req,res)=>{
 if(!req.file) return res.status(422).json({success:false,error:{code:'FILE_REQUIRED',message:'Fichier requis'}});
 const relative=path.relative(path.resolve(__dirname,'../../..'),req.file.path).replace(/\\/g,'/');
 const mediaType=req.file.mimetype.startsWith('image/')?'image':req.file.mimetype==='application/pdf'?'document':'other';
 try {
  const item=await service.create({article_id:req.body.article_id||null,media_type:mediaType,original_name:req.file.originalname,stored_name:req.file.filename,file_path:relative,public_url:`/${relative}`,mime_type:req.file.mimetype,file_size:req.file.size,title:req.body.title||null,alt_text:req.body.alt_text||null},req.user);
  return created(res,item,'Media televerse');
 } catch(error) {
  await fileService.remove(relative).catch(()=>undefined);
  throw error;
 }
});
module.exports=controller;
