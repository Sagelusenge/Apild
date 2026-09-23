const service = require('./article.service');
const { createController } = require('../../utils/crudFactory');
const config = require('../../config/entities').articles;
const asyncHandler = require('../../utils/asyncHandler');
const { success, created } = require('../../utils/response');
const engagement = require('./article.engagement.service');
const db = require('../../config/database');

const controller=createController(service,config);
controller.categories=createController(service.categories,{entityName:'Categorie'});
controller.attachments = asyncHandler(async (request, response) => {
 const rows = await db.query(`SELECT m.id,m.original_name,m.public_url,m.mime_type,m.file_size
   FROM media m JOIN articles a ON a.id=m.article_id
   WHERE a.id=? AND a.status='published' AND a.deleted_at IS NULL
     AND m.deleted_at IS NULL AND m.media_type='document'
   ORDER BY m.created_at ASC`, [request.params.id]);
 return success(response, rows, 'Pièces jointes chargées');
});
controller.unpublish = asyncHandler(async (request, response) => {
 const { article, previous } = await service.unpublish(request.params.id, request.user);
 request.auditMutation = {
  action: 'unpublish',
  entityType: 'articles',
  entityId: article.id,
  oldValues: { status: previous.status, published_at: previous.published_at },
  newValues: { status: article.status, published_at: article.published_at }
 };
 return success(response, article, 'Article retire du site public');
});
controller.engagement = asyncHandler(async (request, response) => (
 success(response, await engagement.engagement(request.params.id, request.query.visitor_id), 'Interactions chargées')
));
controller.comments = asyncHandler(async (request, response) => {
 const result = await engagement.comments(request.params.id, request.query);
 return success(response, result.rows, 'Commentaires chargés', 200, result.meta);
});
controller.createComment = asyncHandler(async (request, response) => (
 created(response, await engagement.addComment(request.params.id, request.body), 'Commentaire publié')
));
controller.toggleLike = asyncHandler(async (request, response) => (
 success(response, await engagement.toggleLike(request.params.id, request.body.visitor_id), 'Réaction enregistrée')
));
controller.share = asyncHandler(async (request, response) => (
 success(response, await engagement.share(request.params.id), 'Partage enregistré')
));
module.exports=controller;
