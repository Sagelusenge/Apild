const service = require('./article.service');
const { createController } = require('../../utils/crudFactory');
const config = require('../../config/entities').articles;
const asyncHandler = require('../../utils/asyncHandler');
const { success, created } = require('../../utils/response');
const engagement = require('./article.engagement.service');

const controller=createController(service,config);
controller.categories=createController(service.categories,{entityName:'Categorie'});
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
