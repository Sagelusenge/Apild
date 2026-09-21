const { createRepository } = require('../../utils/crudFactory');
const config = require('../../config/entities').articles;
const db = require('../../config/database');
const crypto = require('crypto');

const repository=createRepository(config);
repository.categories=createRepository({table:'article_categories',entityName:'categorie',softDelete:false,fields:['name','slug','description'],search:['name','slug','description']});
repository.ensurePublicationNotification = (articleId) => db.query(
  'INSERT IGNORE INTO article_publication_notifications (article_id) VALUES (?)',
  [articleId]
);
repository.preparePublicationRecipients = (articleId) => db.transaction(async (connection) => {
  const [notifications] = await connection.execute(
    'SELECT recipients_prepared_at FROM article_publication_notifications WHERE article_id = ? FOR UPDATE',
    [articleId]
  );
  if (!notifications[0] || notifications[0].recipients_prepared_at) return { prepared: false };

  await connection.execute(`
    INSERT IGNORE INTO article_publication_recipients (article_id, subscriber_id)
    SELECT ?, id
      FROM newsletter_subscribers
     WHERE status = 'active'
  `, [articleId]);
  await connection.execute(
    'UPDATE article_publication_notifications SET recipients_prepared_at = CURRENT_TIMESTAMP WHERE article_id = ?',
    [articleId]
  );
  return { prepared: true };
});
repository.startPublicationNotification = (articleId) => db.query(`
  UPDATE article_publication_notifications
     SET notification_status = 'sending',
         started_at = COALESCE(started_at, CURRENT_TIMESTAMP),
         last_error = NULL
   WHERE article_id = ?
`, [articleId]);
repository.markInactivePublicationRecipients = (articleId) => db.query(`
  UPDATE article_publication_recipients r
  JOIN newsletter_subscribers s ON s.id = r.subscriber_id
     SET r.delivery_status = 'failed',
         r.next_attempt_at = NULL,
         r.error_message = 'Abonnement désactivé avant la diffusion'
   WHERE r.article_id = ?
     AND r.delivery_status IN ('pending', 'failed')
     AND s.status <> 'active'
`, [articleId]);
repository.pendingPublicationRecipients = (articleId, maxAttempts) => db.query(`
  SELECT r.article_id, r.subscriber_id, s.email, s.first_name, s.last_name, s.unsubscribe_token
    FROM article_publication_recipients r
    JOIN newsletter_subscribers s ON s.id = r.subscriber_id
   WHERE r.article_id = ?
     AND s.status = 'active'
     AND (
       r.delivery_status = 'pending'
       OR (
         r.delivery_status = 'failed'
         AND r.attempt_count < ?
         AND (r.next_attempt_at IS NULL OR r.next_attempt_at <= CURRENT_TIMESTAMP)
       )
     )
   ORDER BY r.subscriber_id
`, [articleId, maxAttempts]);
repository.claimPublicationRecipient = async (articleId, subscriberId, maxAttempts) => {
  const result = await db.query(`
    UPDATE article_publication_recipients r
    JOIN newsletter_subscribers s ON s.id = r.subscriber_id
       SET r.delivery_status = 'sending',
           r.last_attempt_at = CURRENT_TIMESTAMP,
           r.attempt_count = r.attempt_count + 1,
           r.next_attempt_at = NULL,
           r.error_message = NULL
     WHERE r.article_id = ?
       AND r.subscriber_id = ?
       AND s.status = 'active'
       AND (
         r.delivery_status = 'pending'
         OR (
           r.delivery_status = 'failed'
           AND r.attempt_count < ?
           AND (r.next_attempt_at IS NULL OR r.next_attempt_at <= CURRENT_TIMESTAMP)
         )
       )
  `, [articleId, subscriberId, maxAttempts]);
  return result.affectedRows === 1;
};
repository.recordPublicationDelivery = (articleId, subscriberId, status, error = null, nextAttemptAt = null) => db.query(`
  UPDATE article_publication_recipients
     SET delivery_status = ?,
         sent_at = CASE WHEN ? = 'sent' THEN CURRENT_TIMESTAMP ELSE sent_at END,
         error_message = ?,
         next_attempt_at = ?
   WHERE article_id = ? AND subscriber_id = ?
`, [status, status, error, nextAttemptAt, articleId, subscriberId]);
repository.ensureSubscriberUnsubscribeToken = async (subscriberId) => {
  const proposedToken = crypto.randomBytes(32).toString('hex');
  await db.query(
    'UPDATE newsletter_subscribers SET unsubscribe_token = COALESCE(unsubscribe_token, ?) WHERE id = ?',
    [proposedToken, subscriberId]
  );
  const rows = await db.query('SELECT unsubscribe_token FROM newsletter_subscribers WHERE id = ? LIMIT 1', [subscriberId]);
  return rows[0]?.unsubscribe_token || null;
};
repository.requeueStalePublicationRecipients = () => db.query(`
  UPDATE article_publication_recipients
     SET delivery_status = 'failed',
         next_attempt_at = CURRENT_TIMESTAMP,
         error_message = COALESCE(error_message, 'Tentative interrompue avant confirmation SMTP')
   WHERE delivery_status = 'sending'
     AND last_attempt_at <= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 10 MINUTE)
`);
repository.pendingPublicationArticles = (maxAttempts) => db.query(`
  SELECT DISTINCT a.*
    FROM articles a
    JOIN article_publication_notifications n ON n.article_id = a.id
   WHERE a.deleted_at IS NULL
     AND a.status = 'published'
     AND n.notification_status IN ('pending', 'sending', 'failed')
     AND (
       n.recipients_prepared_at IS NULL
       OR EXISTS (
         SELECT 1
           FROM article_publication_recipients r
           JOIN newsletter_subscribers s ON s.id = r.subscriber_id
          WHERE r.article_id = a.id
            AND s.status = 'active'
            AND (
              r.delivery_status = 'pending'
              OR (
                r.delivery_status = 'failed'
                AND r.attempt_count < ?
                AND (r.next_attempt_at IS NULL OR r.next_attempt_at <= CURRENT_TIMESTAMP)
              )
            )
       )
     )
`, [maxAttempts]);
repository.summarizePublicationDelivery = async (articleId) => {
  const rows = await db.query(`
    SELECT COUNT(*) AS total,
           SUM(delivery_status = 'sent') AS sent,
           SUM(delivery_status = 'failed') AS failed,
           SUM(delivery_status IN ('pending', 'sending')) AS pending
      FROM article_publication_recipients
     WHERE article_id = ?
  `, [articleId]);
  const summary = rows[0] || {};
  return {
    total: Number(summary.total || 0),
    sent: Number(summary.sent || 0),
    failed: Number(summary.failed || 0),
    pending: Number(summary.pending || 0)
  };
};
repository.completePublicationNotification = (articleId, summary, error = null) => {
  const status = summary.pending > 0 ? 'sending' : summary.failed > 0 ? 'failed' : 'sent';
  return db.query(`
    UPDATE article_publication_notifications
       SET notification_status = ?,
           completed_at = CASE WHEN ? IN ('sent', 'failed') THEN CURRENT_TIMESTAMP ELSE completed_at END,
           total_recipients = ?, sent_count = ?, failed_count = ?, last_error = ?
     WHERE article_id = ?
  `, [status, status, summary.total, summary.sent, summary.failed, error, articleId]);
};
module.exports=repository;
