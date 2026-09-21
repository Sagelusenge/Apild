const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const commonOptions = {
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_request, response) => response.status(429).json({
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Trop de requetes, veuillez reessayer plus tard' }
  })
};

const apiLimiter = rateLimit({ ...commonOptions, limit: env.RATE_LIMIT_MAX });
const authLimiter = rateLimit({ ...commonOptions, limit: env.AUTH_RATE_LIMIT_MAX });
// Public comments, likes and shares are intentionally more constrained than
// regular reads. This keeps the public interaction layer useful without
// turning it into an unauthenticated spam endpoint.
const publicInteractionLimiter = rateLimit({ ...commonOptions, limit: 40 });

module.exports = { apiLimiter, authLimiter, publicInteractionLimiter };
