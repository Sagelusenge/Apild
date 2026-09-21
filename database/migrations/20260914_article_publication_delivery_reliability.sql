-- Reliable publication delivery: recipient snapshot, retries and unsubscribe links.
-- Compatible with the documented MariaDB 10.6+ platform.

ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS unsubscribe_token CHAR(64) NULL AFTER confirmation_token;

CREATE UNIQUE INDEX IF NOT EXISTS uq_newsletter_subscribers_unsubscribe_token
  ON newsletter_subscribers (unsubscribe_token);

ALTER TABLE article_publication_notifications
  ADD COLUMN IF NOT EXISTS recipients_prepared_at DATETIME NULL AFTER started_at;

ALTER TABLE article_publication_recipients
  ADD COLUMN IF NOT EXISTS attempt_count SMALLINT UNSIGNED NOT NULL DEFAULT 0 AFTER last_attempt_at,
  ADD COLUMN IF NOT EXISTS next_attempt_at DATETIME NULL AFTER attempt_count;

CREATE INDEX IF NOT EXISTS idx_article_publication_recipients_retry
  ON article_publication_recipients (delivery_status, next_attempt_at);
