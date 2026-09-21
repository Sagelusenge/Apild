const { createRepository } = require('../../utils/crudFactory');
const config = require('../../config/entities').newsletters;
const db=require('../../config/database');

const repository=createRepository(config);
repository.subscribers=createRepository({table:'newsletter_subscribers',entityName:'abonne',softDelete:false,defaultSort:'subscribed_at',fields:['email','first_name','last_name','status','source','unsubscribed_at'],search:['email','first_name','last_name'],filters:['status','source']});
repository.subscribe=async(payload)=>{
 const email=payload.email.toLowerCase();
 const existing=(await db.query('SELECT id,status FROM newsletter_subscribers WHERE email=? LIMIT 1',[email]))[0];
 await db.query('CALL sp_subscribe_newsletter(?,?,?,?)',[email,payload.first_name||null,payload.last_name||null,payload.source||'api']);
 const subscriber=(await db.query('SELECT * FROM newsletter_subscribers WHERE email=?',[email]))[0];
 return {subscriber,wasNew:!existing};
};
repository.activeSubscribers=()=>db.query("SELECT * FROM newsletter_subscribers WHERE status='active' ORDER BY id");
repository.prepareRecipient=(newsletterId,subscriberId)=>db.query('INSERT IGNORE INTO newsletter_recipients(newsletter_id,subscriber_id) VALUES(?,?)',[newsletterId,subscriberId]);
repository.delivery=(newsletterId,subscriberId,status,error=null)=>db.query(`UPDATE newsletter_recipients SET delivery_status=?,sent_at=CASE WHEN ?='sent' THEN CURRENT_TIMESTAMP ELSE sent_at END,error_message=? WHERE newsletter_id=? AND subscriber_id=?`,[status,status,error,newsletterId,subscriberId]);
repository.setStatus=(id,status)=>db.query(`UPDATE newsletters SET status=?,sent_at=CASE WHEN ?='sent' THEN CURRENT_TIMESTAMP ELSE sent_at END WHERE id=?`,[status,status,id]);
repository.unsubscribeByToken=async(token)=>{
 const rows=await db.query('SELECT id FROM newsletter_subscribers WHERE unsubscribe_token=? LIMIT 1',[token]);
 if(!rows[0]) return false;
 await db.query(`UPDATE newsletter_subscribers SET status='unsubscribed',unsubscribed_at=COALESCE(unsubscribed_at,CURRENT_TIMESTAMP) WHERE id=?`,[rows[0].id]);
 return true;
};
module.exports=repository;
