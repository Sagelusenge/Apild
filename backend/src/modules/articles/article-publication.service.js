const repository = require('./article.repository');
const emailService = require('../../services/email.service');
const logger = require('../../utils/logger');
const { toSqlDateTime } = require('../../utils/date');

const failureMessage = (error) => String(error?.message || 'Erreur d’envoi inconnue').slice(0, 500);
const MAX_DELIVERY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 15 * 60 * 1000;

function nextRetryAt() {
  return toSqlDateTime(new Date(Date.now() + RETRY_DELAY_MS));
}

async function queue(article) {
  await repository.ensurePublicationNotification(article.id);
  await repository.preparePublicationRecipients(article.id);
}

async function dispatch(article) {
  await queue(article);
  await repository.markInactivePublicationRecipients(article.id);
  await repository.startPublicationNotification(article.id);

  const recipients = await repository.pendingPublicationRecipients(article.id, MAX_DELIVERY_ATTEMPTS);
  for (const recipient of recipients) {
    // An atomic state transition makes concurrent publication jobs safe and prevents duplicate mail.
    if (!(await repository.claimPublicationRecipient(article.id, recipient.subscriber_id, MAX_DELIVERY_ATTEMPTS))) continue;
    try {
      const unsubscribeToken = recipient.unsubscribe_token
        || await repository.ensureSubscriberUnsubscribeToken(recipient.subscriber_id);
      if (!unsubscribeToken) throw new Error('Impossible de préparer le lien de désabonnement');
      await emailService.sendArticlePublication({ ...recipient, unsubscribe_token: unsubscribeToken }, article);
      await repository.recordPublicationDelivery(article.id, recipient.subscriber_id, 'sent');
    } catch (error) {
      await repository.recordPublicationDelivery(
        article.id,
        recipient.subscriber_id,
        'failed',
        failureMessage(error),
        nextRetryAt()
      );
    }
  }

  const summary = await repository.summarizePublicationDelivery(article.id);
  const summaryError = summary.failed ? `${summary.failed} destinataire(s) en échec de diffusion` : null;
  await repository.completePublicationNotification(article.id, summary, summaryError);
  return summary;
}

async function resumePending() {
  await repository.requeueStalePublicationRecipients();
  const articles = await repository.pendingPublicationArticles(MAX_DELIVERY_ATTEMPTS);
  const results = await Promise.allSettled(articles.map((article) => dispatch(article)));
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      logger.error({ err: result.reason, articleId: articles[index].id }, 'Échec de reprise de diffusion de publication');
    }
  });
  return { queued: articles.length, completed: results.filter((result) => result.status === 'fulfilled').length };
}

function schedule(article) {
  setImmediate(() => {
    dispatch(article).catch((error) => {
      logger.error({ err: error, articleId: article.id }, 'Échec de la diffusion de publication');
    });
  });
}

module.exports = { queue, dispatch, resumePending, schedule, MAX_DELIVERY_ATTEMPTS };
