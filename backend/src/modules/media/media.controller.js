const service = require('./media.service');
const { createController } = require('../../utils/crudFactory');
const config = require('../../config/entities').media;
const asyncHandler=require('../../utils/asyncHandler');
const {created}=require('../../utils/response');
const fileService=require('../../services/file.service');
const fs=require('fs/promises');
const crypto=require('crypto');
const db=require('../../config/database');
const env=require('../../config/env');
const AppError=require('../../utils/AppError');

const controller=createController(service,config);
controller.upload=asyncHandler(async(req,res)=>{
 if(!req.file) return res.status(422).json({success:false,error:{code:'FILE_REQUIRED',message:'Fichier requis'}});
 const relative=fileService.uploadRelativePath('images',req.file);
 const mediaType=req.file.mimetype.startsWith('image/')?'image':'document';
 const databaseStorage=env.NODE_ENV==='production'&&env.FILE_STORAGE==='local';
 const publicKey=databaseStorage?crypto.randomUUID():null;
 try {
  await fileService.persistUpload(req.file,relative);
  const item=await service.create({article_id:req.body.article_id||null,media_type:mediaType,original_name:req.file.originalname,stored_name:req.file.filename,file_path:relative,public_url:databaseStorage?`/api/media/files/${publicKey}`:`/${relative}`,mime_type:req.file.mimetype,file_size:req.file.size,title:req.body.title||null,alt_text:req.body.alt_text||null},req.user);
  if(databaseStorage){
   const content=req.file.buffer||await fs.readFile(req.file.path);
   await db.query('INSERT INTO media_file_contents(media_id,public_key,content) VALUES(?,?,?)',[item.id,publicKey,content]);
   if(req.file.path)await fs.unlink(req.file.path).catch(()=>undefined);
  }
  return created(res,item,'Media televerse');
 } catch(error) {
  await fileService.remove(relative).catch(()=>undefined);
  throw error;
 }
});
controller.publicFile=asyncHandler(async(req,res)=>{
 if(!/^[0-9a-f-]{36}$/i.test(req.params.key))throw new AppError('Fichier introuvable',404,'NOT_FOUND');
 const rows=await db.query(`SELECT m.mime_type,m.original_name,c.content FROM media_file_contents c JOIN media m ON m.id=c.media_id WHERE c.public_key=? AND m.deleted_at IS NULL LIMIT 1`,[req.params.key]);
 if(!rows[0])throw new AppError('Fichier introuvable',404,'NOT_FOUND');
 res.type(rows[0].mime_type);
 res.setHeader('content-disposition',`inline; filename*=UTF-8''${encodeURIComponent(rows[0].original_name)}`);
 res.setHeader('cache-control','public, max-age=86400');
 return res.send(rows[0].content);
});
module.exports=controller;
