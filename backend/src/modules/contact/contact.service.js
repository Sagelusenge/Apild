const repository = require('./contact.repository');
const { createService } = require('../../utils/crudFactory');
const config = require('../../config/entities').contact;
const sanitize=require('../../utils/sanitize');

const base=createService(repository,config);
const clean=(payload)=>({...payload,name:sanitize.text(payload.name),subject:sanitize.text(payload.subject),message:sanitize.text(payload.message)});
module.exports={...base,create:(payload,user)=>base.create(clean(payload),user),update:(id,payload,user)=>base.update(id,clean(payload),user)};
