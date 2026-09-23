const service = require('./settings.service');
const { createController } = require('../../utils/crudFactory');
const config = require('../../config/entities').settings;
const asyncHandler=require('../../utils/asyncHandler');
const {success}=require('../../utils/response');
const emailService=require('../../services/email.service');
const {emailLayout}=require('../../services/emailTemplate');

const controller=createController(service,config);
controller.testEmail=asyncHandler(async(req,res)=>{
 const result=await emailService.sendMail({to:req.body.email,subject:'Test SMTP APILD',text:'La configuration SMTP de la plateforme APILD fonctionne correctement.',html:emailLayout({eyebrow:'Vérification technique',title:'Votre messagerie APILD fonctionne',body:'<p>Ce message confirme que la configuration SMTP de la plateforme APILD fonctionne correctement.</p>',calloutTitle:'Test réussi',calloutBody:'Les e-mails transactionnels peuvent être envoyés depuis cette configuration.'})});
 return success(res,{accepted:result.accepted||[],preview:Boolean(result.preview)},result.preview?'SMTP non configure: aucun email envoye':'Email de test envoye');
});
module.exports=controller;
