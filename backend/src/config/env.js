const path = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const booleanFromString = z.preprocess(
  (value) => String(value).toLowerCase() === 'true',
  z.boolean()
);

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_PREFIX: z.string().default('/api'),
  APP_URL: z.string().default('http://localhost:4000'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().min(1).default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().min(1).default('apild_platform'),
  DB_CONNECTION_LIMIT: z.coerce.number().int().positive().default(10),
  DB_SSL: booleanFromString.default(false),
  DB_SSL_REJECT_UNAUTHORIZED: booleanFromString.default(true),
  DB_SSL_CA: z.string().default(''),
  FILE_STORAGE: z.enum(['local', 's3']).default('local'),
  S3_BUCKET: z.string().default(''),
  S3_REGION: z.string().default(''),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(8).max(15).default(12),
  ALLOW_PUBLIC_REGISTRATION: booleanFromString.default(false),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: booleanFromString.default(false),
  SMTP_USER: z.string().default(''),
  SMTP_PASSWORD: z.string().default(''),
  SMTP_AUTH_TYPE: z.enum(['password', 'oauth2']).default('password'),
  SMTP_CLIENT_ID: z.string().default(''),
  SMTP_CLIENT_SECRET: z.string().default(''),
  SMTP_REFRESH_TOKEN: z.string().default(''),
  SMTP_ACCESS_TOKEN: z.string().default(''),
  MAIL_FROM: z.string().default('APILD <no-reply@apild.local>'),
  UPLOAD_MAX_SIZE_MB: z.coerce.number().positive().default(10),
  LOG_LEVEL: z.string().default('info'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  ENABLE_JOBS: booleanFromString.default(false),
  TRUST_PROXY: z.string().default('false')
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  throw new Error(`Configuration invalide: ${details}`);
}

if (parsed.data.NODE_ENV === 'production') {
  const unsafe = [
    ['DB_PASSWORD', parsed.data.DB_PASSWORD],
    ['JWT_ACCESS_SECRET', parsed.data.JWT_ACCESS_SECRET],
    ['JWT_REFRESH_SECRET', parsed.data.JWT_REFRESH_SECRET]
  ].filter(([, value]) => !value || /change[_-]?me/i.test(value));
  if (unsafe.length) throw new Error(`Secrets de production non configures: ${unsafe.map(([key]) => key).join(', ')}`);
  if (parsed.data.DB_SSL && parsed.data.DB_SSL_REJECT_UNAUTHORIZED && !parsed.data.DB_SSL_CA.trim()) {
    throw new Error('DB_SSL_CA doit etre configure lorsque la verification TLS de la base est activee.');
  }
  if (parsed.data.FILE_STORAGE === 's3' && (!parsed.data.S3_BUCKET.trim() || !parsed.data.S3_REGION.trim())) {
    throw new Error('S3_BUCKET et S3_REGION doivent etre configures lorsque FILE_STORAGE=s3.');
  }
  if (parsed.data.SMTP_HOST && parsed.data.SMTP_AUTH_TYPE === 'password' && (!parsed.data.SMTP_PASSWORD || /change[_-]?me/i.test(parsed.data.SMTP_PASSWORD))) {
    throw new Error('SMTP_PASSWORD doit etre configure en production');
  }
  if (parsed.data.SMTP_HOST && parsed.data.SMTP_AUTH_TYPE === 'oauth2' && (!parsed.data.SMTP_USER || !parsed.data.SMTP_CLIENT_ID || (!parsed.data.SMTP_REFRESH_TOKEN && !parsed.data.SMTP_ACCESS_TOKEN))) {
    throw new Error('La configuration SMTP OAuth2 est incomplete');
  }
}

module.exports = Object.freeze(parsed.data);
