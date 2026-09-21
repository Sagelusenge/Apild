const env = require('../config/env');
const { getTransporter } = require('../config/mail');
const logger = require('../utils/logger');

async function sendMail(options) {
  const transporter = getTransporter();
  // Database integration tests use real-looking recipient addresses.  Never
  // permit that test suite to contact a real SMTP transport, even if a
  // developer's local .env has credentials configured.  A Jest mock remains
  // usable so the focused email-template tests can assert their contracts.
  if (process.env.RUN_DB_TESTS === 'true' && !transporter?.sendMail?._isMockFunction) {
    logger.debug?.({ subject: options.subject }, 'Envoi SMTP neutralisé pour les tests');
    return { accepted: [], preview: true, suppressed: true };
  }
  if (!transporter) {
    logger.warn({ to: options.to, subject: options.subject }, 'SMTP non configure: email non envoye');
    return { accepted: [], preview: true };
  }
  return transporter.sendMail({ from: env.MAIL_FROM, ...options });
}

function sendPasswordReset(user, token) {
  const resetUrl = `${env.FRONTEND_URL}/reinitialiser-mot-de-passe?token=${encodeURIComponent(token)}`;
  return sendMail({
    to: user.email,
    subject: 'Reinitialisation de votre mot de passe APILD',
    text: `Bonjour ${user.first_name}, utilisez ce lien dans les 24 heures: ${resetUrl}`,
    html: `<p>Bonjour ${user.first_name},</p><p><a href="${resetUrl}">Reinitialiser mon mot de passe</a></p><p>Ce lien expire dans 24 heures.</p>`
  });
}

function sendNewsletter(subscriber, newsletter) {
  return sendMail({
    to: subscriber.email,
    subject: newsletter.subject,
    text: newsletter.preview_text || newsletter.subject,
    html: newsletter.content
  });
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

function plainText(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeAddress(value) {
  return String(value || '').trim().toLowerCase();
}

function assertArticleDelivery(result, recipientEmail) {
  if (result?.preview) throw new Error('SMTP non configuré : aucune publication n’a été envoyée');
  const accepted = Array.isArray(result?.accepted) ? result.accepted.map(normalizeAddress) : [];
  const rejected = Array.isArray(result?.rejected) ? result.rejected.map(normalizeAddress) : [];
  if (rejected.length) throw new Error(`SMTP a refusé le destinataire : ${rejected.join(', ')}`);
  if (!accepted.includes(normalizeAddress(recipientEmail))) {
    throw new Error('SMTP n’a confirmé aucun destinataire pour cette publication');
  }
  return result;
}

async function sendArticlePublication(subscriber, article) {
  const recipient = subscriber.first_name ? `Bonjour ${subscriber.first_name},` : 'Bonjour,';
  const articleUrl = `${env.FRONTEND_URL}/actualites/${encodeURIComponent(article.id)}`;
  const unsubscribeUrl = subscriber.unsubscribe_token
    ? `${env.FRONTEND_URL}/desabonnement?token=${encodeURIComponent(subscriber.unsubscribe_token)}`
    : null;
  const title = escapeHtml(article.title);
  const excerpt = escapeHtml(plainText(article.excerpt || article.content).slice(0, 420));
  const result = await sendMail({
    to: subscriber.email,
    subject: `Nouvelle publication APILD : ${article.title}`,
    text: `${recipient}\n\nUne nouvelle publication est disponible : ${article.title}\n${plainText(article.excerpt || article.content)}\n\nLire l’article : ${articleUrl}${unsubscribeUrl ? `\n\nSe désabonner : ${unsubscribeUrl}` : ''}`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#173047"><p>${escapeHtml(recipient)}</p><p>Une nouvelle publication est disponible sur APILD.</p><h2 style="margin:0 0 10px;color:#063c48">${title}</h2><p>${excerpt}</p><p><a href="${articleUrl}" style="display:inline-block;padding:11px 16px;border-radius:8px;background:#087657;color:#fff;text-decoration:none;font-weight:700">Lire l’article</a></p>${unsubscribeUrl ? `<p style="margin-top:24px;font-size:12px;color:#5f6f78">Vous ne souhaitez plus recevoir ces nouvelles ? <a href="${unsubscribeUrl}" style="color:#087657">Se désabonner</a></p>` : ''}</div>`
  });
  return assertArticleDelivery(result, subscriber.email);
}

module.exports = { sendMail, sendPasswordReset, sendNewsletter, sendArticlePublication };
