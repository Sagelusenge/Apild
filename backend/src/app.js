const crypto = require('crypto');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const pinoHttp = require('pino-http');
const appConfig = require('./config/app.config');
const db = require('./config/database');
const routes = require('./routes');
const logger = require('./utils/logger');
const asyncHandler = require('./utils/asyncHandler');
const { apiLimiter } = require('./middlewares/rateLimit.middleware');
const { notFound, errorHandler } = require('./middlewares/error.middleware');
const auditMutation = require('./middlewares/audit.middleware');
const fileService = require('./services/file.service');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', appConfig.trustProxy);
app.use((request, response, next) => {
  request.id = request.get('x-request-id') || crypto.randomUUID();
  response.setHeader('x-request-id', request.id);
  next();
});
app.use(pinoHttp({ logger, genReqId: (request) => request.id }));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin(origin, callback) {
    if (!origin || appConfig.allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
if (appConfig.fileStorage === 's3') {
  app.get('/uploads/images/{*filePath}', asyncHandler(async (request, response) => {
    const segments = Array.isArray(request.params.filePath) ? request.params.filePath : [request.params.filePath];
    const relativePath = `uploads/images/${segments.filter(Boolean).join('/')}`;
    const file = await fileService.getFile(relativePath);
    response.type(file.contentType || 'application/octet-stream');
    response.setHeader('cache-control', file.cacheControl || 'public, max-age=86400');
    if (file.contentLength) response.setHeader('content-length', String(file.contentLength));
    return file.stream.pipe(response);
  }));
} else {
  app.use('/uploads/images', express.static(path.join(__dirname, '../uploads/images'), {
    fallthrough: false,
    maxAge: '1d',
    dotfiles: 'deny',
    immutable: appConfig.env === 'production'
  }));
}
app.use(apiLimiter);

app.get('/health', (_request, response) => response.json({
  success: true,
  data: { service: appConfig.name, version: appConfig.version, environment: appConfig.env, uptime: process.uptime() }
}));

app.get('/health/database', asyncHandler(async (_request, response) => {
  const healthy = await db.healthCheck();
  response.status(healthy ? 200 : 503).json({ success: healthy, data: { database: healthy ? 'connected' : 'unavailable' } });
}));

app.use(appConfig.apiPrefix, auditMutation, routes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
