const env = require('../config/env');
const { getTransporter } = require('../config/mail');
const logger = require('../utils/logger');
const sanitize = require('../utils/sanitize');
const { emailLayout, escapeHtml, plainText } = require('./emailTemplate');

async function sendMail(options) {
  if (env.EMAIL_FEATURES_ENABLED === false) return { accepted: [], preview: true, suppressed: true };
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
    subject: 'Réinitialisation de votre mot de passe APILD',
    text: `Bonjour ${user.first_name},\n\nUtilisez ce lien dans les 24 heures pour réinitialiser votre mot de passe : ${resetUrl}\n\nSi vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.`,
    html: emailLayout({
      eyebrow: 'Sécurité du compte',
      title: 'Réinitialiser votre mot de passe',
      preheader: 'Votre lien de réinitialisation APILD est valable 24 heures.',
      body: `<p>Bonjour ${escapeHtml(user.first_name)},</p><p>Une demande de réinitialisation du mot de passe a été reçue pour votre compte APILD.</p>`,
      calloutTitle: 'Lien valable 24 heures',
      calloutBody: 'Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail : votre compte reste protégé.',
      actionLabel: 'Choisir un nouveau mot de passe',
      actionUrl: resetUrl
    })
  });
}

function unsubscribeUrl(subscriber) {
  return subscriber.unsubscribe_token
    ? `${env.FRONTEND_URL}/desabonnement?token=${encodeURIComponent(subscriber.unsubscribe_token)}`
    : null;
}

async function sendNewsletter(subscriber, newsletter) {
  const recipient = subscriber.first_name ? `Bonjour ${subscriber.first_name},` : 'Bonjour,';
  const content = sanitize.richText(newsletter.content || '');
  const result = await sendMail({
    to: subscriber.email,
    subject: newsletter.subject,
    text: `${recipient}\n\n${newsletter.preview_text || plainText(content)}${unsubscribeUrl(subscriber) ? `\n\nSe désabonner : ${unsubscribeUrl(subscriber)}` : ''}`,
    html: emailLayout({
      eyebrow: 'La lettre APILD',
      title: newsletter.subject,
      preheader: newsletter.preview_text || newsletter.subject,
      body: `<p>${escapeHtml(recipient)}</p>${content}`,
      unsubscribeUrl: unsubscribeUrl(subscriber)
    })
  });
  return assertDelivery(result, subscriber.email, 'newsletter');
}

function sendSubscriptionWelcome(subscriber) {
  const name = subscriber.first_name ? ` ${subscriber.first_name}` : '';
  const preferencesUrl = unsubscribeUrl(subscriber);
  return sendMail({
    to: subscriber.email,
    subject: 'Bienvenue dans la newsletter APILD',
    text: `Bonjour${name},\n\nVotre inscription à la newsletter APILD est enregistrée. Vous recevrez nos publications et informations sur les initiatives locales.${preferencesUrl ? `\n\nSe désabonner : ${preferencesUrl}` : ''}`,
    html: emailLayout({
      eyebrow: 'Inscription confirmée',
      title: 'Bienvenue dans la communauté APILD',
      preheader: 'Votre inscription à la newsletter est confirmée.',
      body: `<p>Bonjour${escapeHtml(name)},</p><p>Votre inscription est bien enregistrée. Vous recevrez les nouvelles publications, les projets et les informations utiles d’APILD.</p>`,
      calloutTitle: 'Vous gardez le contrôle',
      calloutBody: 'Vous pouvez vous désabonner à tout moment depuis chaque e-mail.',
      actionLabel: 'Découvrir APILD',
      actionUrl: env.FRONTEND_URL,
      unsubscribeUrl: preferencesUrl
    })
  });
}

function normalizeAddress(value) {
  return String(value || '').trim().toLowerCase();
}

function assertDelivery(result, recipientEmail, kind = 'publication') {
  if (result?.preview) throw new Error(`SMTP non configuré : aucune ${kind} n’a été envoyée`);
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
  const optOutUrl = unsubscribeUrl(subscriber);
  const excerpt = plainText(article.excerpt || article.content).slice(0, 420);
  const result = await sendMail({
    to: subscriber.email,
    subject: `Nouvelle publication APILD : ${article.title}`,
    text: `${recipient}\n\nUne nouvelle publication est disponible : ${article.title}\n${excerpt}\n\nLire l’article : ${articleUrl}${optOutUrl ? `\n\nSe désabonner : ${optOutUrl}` : ''}`,
    html: emailLayout({
      eyebrow: 'Nouvel article',
      title: article.title,
      preheader: excerpt,
      body: `<p>${escapeHtml(recipient)}</p><p>Une nouvelle publication APILD est disponible.</p>`,
      calloutTitle: 'À lire sur APILD',
      calloutBody: excerpt,
      actionLabel: 'Lire l’article',
      actionUrl: articleUrl,
      unsubscribeUrl: optOutUrl
    })
  });
  return assertDelivery(result, subscriber.email);
}

module.exports = { sendMail, sendPasswordReset, sendNewsletter, sendSubscriptionWelcome, sendArticlePublication };
