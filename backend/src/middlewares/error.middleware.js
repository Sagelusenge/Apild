const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

function notFound(request, _response, next) {
  next(new AppError(`Route introuvable: ${request.method} ${request.originalUrl}`, 404, 'ROUTE_NOT_FOUND'));
}

function errorHandler(error, request, response, _next) {
  let normalized = error;
  if (error.code === 'ER_DUP_ENTRY') normalized = new AppError('Cette ressource existe deja', 409, 'DUPLICATE_ENTRY');
  if (error.code === 'ER_NO_REFERENCED_ROW_2') normalized = new AppError('Une ressource associee est introuvable', 422, 'INVALID_RELATION');
  if (error.code === 'ER_ROW_IS_REFERENCED_2') normalized = new AppError('Cette ressource est encore utilisee', 409, 'RESOURCE_IN_USE');
  if (error.code === 'ER_CHECK_CONSTRAINT_VIOLATED' || error.errno === 4025) normalized = new AppError('Une contrainte metier n est pas respectee', 422, 'CONSTRAINT_VIOLATION');

  const statusCode = normalized.statusCode || 500;
  if (statusCode >= 500) {
    logger.error({ err: error, method: request.method, url: request.originalUrl }, 'Erreur serveur');
  }

  response.status(statusCode).json({
    success: false,
    error: {
      code: normalized.code || 'INTERNAL_ERROR',
      message: statusCode === 500 ? 'Une erreur interne est survenue' : normalized.message,
      ...(normalized.details ? { details: normalized.details } : {}),
      ...(process.env.NODE_ENV === 'development' && statusCode === 500 ? { debug: normalized.message } : {})
    }
  });
}

module.exports = { notFound, errorHandler };
