const nodemailer = require('nodemailer');
const env = require('./env');

let transporter;

function getTransporter() {
  if (!env.SMTP_HOST) return null;
  if (!transporter) {
    const passwordAuth = env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined;
    const oauth2Auth = env.SMTP_USER ? {
      type: 'OAuth2',
      user: env.SMTP_USER,
      clientId: env.SMTP_CLIENT_ID,
      clientSecret: env.SMTP_CLIENT_SECRET || undefined,
      refreshToken: env.SMTP_REFRESH_TOKEN || undefined,
      accessToken: env.SMTP_ACCESS_TOKEN || undefined
    } : undefined;
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_AUTH_TYPE === 'oauth2' ? oauth2Auth : passwordAuth
    });
  }
  return transporter;
}

module.exports = { getTransporter };
