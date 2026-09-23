const service = require('./settings.service');
const { createController } = require('../../utils/crudFactory');
const config = require('../../config/entities').settings;
const asyncHandler=require('../../utils/asyncHandler');
const {success}=require('../../utils/response');
const emailService=require('../../services/email.service');
const {emailLayout}=require('../../services/emailTemplate');
const env=require('../../config/env');
const AppError=require('../../utils/AppError');

const controller=createController(service,config);
controller.testEmail=asyncHandler(async(req,res)=>{
 if(env.EMAIL_FEATURES_ENABLED===false)throw new AppError('Envois d’e-mails désactivés sur cette version.',503,'EMAIL_DISABLED');
 const result=await emailService.sendMail({to:req.body.email,subject:'Test SMTP APILD',text:'La configuration SMTP de la plateforme APILD fonctionne correctement.',html:emailLayout({eyebrow:'Vérification technique',title:'Votre messagerie APILD fonctionne',body:'<p>Ce message confirme que la configuration SMTP de la plateforme APILD fonctionne correctement.</p>',calloutTitle:'Test réussi',calloutBody:'Les e-mails transactionnels peuvent être envoyés depuis cette configuration.'})});
 return success(res,{accepted:result.accepted||[],preview:Boolean(result.preview)},result.preview?'SMTP non configure: aucun email envoye':'Email de test envoye');
});
module.exports=controller;
