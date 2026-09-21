const repository = require('./article.repository');
const { createService } = require('../../utils/crudFactory');
const config = require('../../config/entities').articles;
const sanitize=require('../../utils/sanitize');
const { toSqlDateTime } = require('../../utils/date');
const publicationService = require('./article-publication.service');
const AppError = require('../../utils/AppError');

const base=createService(repository,config);
const categories=createService(repository.categories,{
 entityName:'Categorie', autoSlugField:'slug', autoSlugSource:'name'
});
const clean=(payload)=>({...payload,
 title:sanitize.text(payload.title),
 excerpt:sanitize.text(payload.excerpt),
 content:sanitize.richText(payload.content)
});
const withPublicationDate = (payload, previous) => {
 const article = clean(payload);
 if (article.status === 'published' && previous?.status !== 'published' && !article.published_at) article.published_at = toSqlDateTime();
 return article;
};
module.exports={...base,categories,
 async create(payload,user) {
  const article = await base.create(withPublicationDate(payload),user);
  if (article.status === 'published') {
   await publicationService.queue(article);
   publicationService.schedule(article);
  }
  return article;
 },
 async update(id,payload,user) {
  const previous = await base.get(id);
  const article = await base.update(id,withPublicationDate(payload,previous),user);
  if (article.status === 'published') {
   await publicationService.queue(article);
   publicationService.schedule(article);
  }
  return article;
 },
 async unpublish(id, user) {
  const previous = await base.get(id);
  if (previous.status !== 'published') {
   throw new AppError('Cet article n’est pas actuellement publie', 409, 'ARTICLE_NOT_PUBLISHED');
  }

  // Archived articles are retained in the editorial workspace, including
  // their reference and original publication date, but are excluded from the
  // public filter (which only exposes status=published).
  const article = await base.update(id, { status: 'archived' }, user);
  return { article, previous };
 }
};
