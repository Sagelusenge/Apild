const service = require('./settings.service');
const { createController } = require('../../utils/crudFactory');
const config = require('../../config/entities').settings;
const asyncHandler=require('../../utils/asyncHandler');
const {success}=require('../../utils/response');
const emailService=require('../../services/email.service');

const controller=createController(service,config);
controller.testEmail=asyncHandler(async(req,res)=>{
 const result=await emailService.sendMail({to:req.body.email,subject:'Test SMTP APILD',text:'La configuration SMTP de la plateforme APILD fonctionne correctement.',html:'<p>La configuration SMTP de la plateforme <strong>APILD</strong> fonctionne correctement.</p>'});
 return success(res,{accepted:result.accepted||[],preview:Boolean(result.preview)},result.preview?'SMTP non configure: aucun email envoye':'Email de test envoye');
});
module.exports=controller;
