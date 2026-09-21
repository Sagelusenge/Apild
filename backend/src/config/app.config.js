const path = require('path');
const env = require('./env');

module.exports = Object.freeze({
  name: 'APILD Platform API',
  version: '1.0.0',
  env: env.NODE_ENV,
  port: env.PORT,
  apiPrefix: env.API_PREFIX,
  frontendUrl: env.FRONTEND_URL,
  allowedOrigins: env.FRONTEND_URL.split(',').map((origin) => origin.trim()).filter(Boolean),
  trustProxy: env.TRUST_PROXY === 'true' ? true : env.TRUST_PROXY === 'false' ? false : Number.parseInt(env.TRUST_PROXY, 10) || false,
  uploadsDirectory: path.resolve(__dirname, '../../uploads'),
  maxUploadBytes: env.UPLOAD_MAX_SIZE_MB * 1024 * 1024
});
