const { ZodError } = require('zod');
const AppError = require('../utils/AppError');

function validate(schema, source = 'body') {
  return (request, _response, next) => {
    try {
      request[source] = schema.parse(request[source]);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(new AppError('Donnees invalides', 422, 'VALIDATION_ERROR', error.flatten()));
      }
      return next(error);
    }
  };
}

function validateCrudBody(config, partial = false) {
  return (request, _response, next) => {
    const allowed = new Set(config.fields);
    const unknown = Object.keys(request.body || {}).filter((key) => !allowed.has(key));
    if (unknown.length) {
      return next(new AppError(`Champs non autorises: ${unknown.join(', ')}`, 422, 'UNKNOWN_FIELDS'));
    }

    if (!partial) {
      const missing = (config.required || []).filter((key) => request.body?.[key] === undefined || request.body?.[key] === null || request.body?.[key] === '');
      if (missing.length) {
        return next(new AppError(`Champs obligatoires: ${missing.join(', ')}`, 422, 'MISSING_FIELDS'));
      }
    }

    if (partial && Object.keys(request.body || {}).length === 0) {
      return next(new AppError('Aucune donnee a modifier', 422, 'EMPTY_BODY'));
    }
    return next();
  };
}

module.exports = { validate, validateCrudBody };
