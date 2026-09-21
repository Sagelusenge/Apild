const repository = require('./newsletter.repository');
const { createService } = require('../../utils/crudFactory');
const config = require('../../config/entities').newsletters;
const emailService=require('../../services/email.service');
const AppError=require('../../utils/AppError');
const sanitize=require('../../utils/sanitize');
const notificationService=require('../notifications/notification.service');
const logger=require('../../utils/logger');

const base=createService(repository,config);
const subscribers=createService(repository.subscribers,{entityName:'Abonne'});
async function send(id){
 const newsletter=await base.get(id);
 if(!['draft','scheduled','sending'].includes(newsletter.status))throw new AppError('Cette newsletter ne peut plus etre envoyee',409,'INVALID_STATUS');
 const list=await repository.activeSubscribers();
 await repository.setStatus(id,'sending');
 let sent=0,failed=0;
 for(const subscriber of list){
  await repository.prepareRecipient(id,subscriber.id);
  try{await emailService.sendNewsletter(subscriber,newsletter);await repository.delivery(id,subscriber.id,'sent');sent++;}
  catch(error){await repository.delivery(id,subscriber.id,'failed',error.message.slice(0,500));failed++;}
 }
 await repository.setStatus(id,'sent');
 return {recipients:list.length,sent,failed};
}
async function unsubscribe(token){
 if(!(await repository.unsubscribeByToken(token)))throw new AppError('Lien de désabonnement invalide',404,'INVALID_UNSUBSCRIBE_TOKEN');
 return {unsubscribed:true};
}
const clean=(payload)=>({...payload,subject:sanitize.text(payload.subject),preview_text:sanitize.text(payload.preview_text),content:sanitize.richText(payload.content)});
async function subscribe(payload){
 const {subscriber,wasNew}=await repository.subscribe(payload);
 if(wasNew){
  try{
   await notificationService.createForRoles(['communication'],{
    notification_type:'newsletter_subscription',
    title:'Nouvel abonnement à la newsletter',
    message:`${subscriber.email} vient de s’abonner à la newsletter.`,
    link_url:'/admin/newsletter/subscribers'
   });
  }catch(error){
   // The public subscription remains successful even if the internal bell
   // cannot be updated; delivery and audit data must not be lost to a UI alert.
   logger.warn({err:error},'Impossible de créer la notification d abonnement newsletter');
  }
 }
 return subscriber;
}
module.exports={...base,subscribers,subscribe,unsubscribe,send,
 create:(payload,user)=>base.create(clean(payload),user),
 update:(id,payload,user)=>base.update(id,clean(payload),user)
};
