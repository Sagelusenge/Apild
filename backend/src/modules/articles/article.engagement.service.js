const crypto = require('crypto');
const AppError = require('../../utils/AppError');
const sanitize = require('../../utils/sanitize');
const { getPagination, getPaginationMeta } = require('../../utils/pagination');
const repository = require('./article.engagement.repository');

function articleId(value) {
  const id = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(id) || id < 1) throw new AppError('Actualité introuvable', 404, 'NOT_FOUND');
  return id;
}

function visitorHash(visitorId) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(visitorId || ''))) {
    throw new AppError('Identifiant visiteur invalide', 422, 'INVALID_VISITOR');
  }
  return crypto.createHash('sha256').update(String(visitorId)).digest('hex');
}

async function requirePublishedArticle(value) {
  const id = articleId(value);
  if (!(await repository.findPublishedArticle(id))) throw new AppError('Actualité introuvable', 404, 'NOT_FOUND');
  return id;
}

function normalizedSummary(summary, liked = false) {
  return {
    likes_count: Number(summary?.likes_count || 0),
    shares_count: Number(summary?.shares_count || 0),
    comments_count: Number(summary?.comments_count || 0),
    liked: Boolean(liked)
  };
}

async function engagement(id, visitorId) {
  const articleIdValue = await requirePublishedArticle(id);
  const hash = visitorId ? visitorHash(visitorId) : null;
  const [summary, liked] = await Promise.all([
    repository.feedbackSummary(articleIdValue),
    hash ? repository.hasReaction(articleIdValue, hash) : false
  ]);
  return normalizedSummary(summary, liked);
}

async function comments(id, query) {
  const articleIdValue = await requirePublishedArticle(id);
  const { page, limit, offset } = getPagination(query);
  const result = await repository.listComments(articleIdValue, { limit, offset });
  return { rows: result.rows, meta: getPaginationMeta(result.total, page, limit) };
}

async function addComment(id, payload) {
  const articleIdValue = await requirePublishedArticle(id);
  const comment = {
    author_name: sanitize.text(payload.author_name),
    author_email: payload.author_email ? String(payload.author_email).trim().toLowerCase() : null,
    content: sanitize.text(payload.content)
  };
  if (comment.author_name.length < 2 || comment.content.length < 2) {
    throw new AppError('Le commentaire doit contenir un nom et un message valides', 422, 'INVALID_COMMENT');
  }
  const created = await repository.createComment(articleIdValue, comment);
  const summary = await repository.feedbackSummary(articleIdValue);
  return { comment: created, feedback: normalizedSummary(summary) };
}

async function toggleLike(id, visitorId) {
  const articleIdValue = articleId(id);
  const result = await repository.toggleReaction(articleIdValue, visitorHash(visitorId));
  if (!result) throw new AppError('Actualité introuvable', 404, 'NOT_FOUND');
  return normalizedSummary(result, result.liked);
}

async function share(id) {
  const articleIdValue = articleId(id);
  const result = await repository.registerShare(articleIdValue);
  if (!result) throw new AppError('Actualité introuvable', 404, 'NOT_FOUND');
  return normalizedSummary(result);
}

module.exports = { engagement, comments, addComment, toggleLike, share };
