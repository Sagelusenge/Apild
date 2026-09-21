-- Operational planning: independent tasks, meeting reminders and a durable
-- outbound-email queue.  The queue deliberately stores rendered content so a
-- scheduled message remains faithful to the invitation that was approved.

ALTER TABLE tasks
  MODIFY COLUMN project_id BIGINT UNSIGNED NULL;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS reminder_minutes INT UNSIGNED NOT NULL DEFAULT 30 AFTER ends_at;

CREATE INDEX IF NOT EXISTS idx_events_reminder_schedule
  ON events (status, starts_at, reminder_minutes, deleted_at);

CREATE TABLE IF NOT EXISTS operational_email_queue (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email_kind VARCHAR(60) NOT NULL,
  recipient_email VARCHAR(190) NOT NULL,
  recipient_name VARCHAR(201) NULL,
  subject VARCHAR(255) NOT NULL,
  text_body TEXT NOT NULL,
  html_body MEDIUMTEXT NOT NULL,
  scheduled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  delivery_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  sent_at DATETIME NULL,
  last_error VARCHAR(500) NULL,
  event_id BIGINT UNSIGNED NULL,
  project_id BIGINT UNSIGNED NULL,
  user_id BIGINT UNSIGNED NULL,
  dedupe_key VARCHAR(191) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_operational_email_dedupe (dedupe_key),
  KEY idx_operational_email_due (delivery_status, scheduled_at),
  KEY idx_operational_email_event (event_id),
  KEY idx_operational_email_project (project_id),
  CONSTRAINT fk_operational_email_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
  CONSTRAINT fk_operational_email_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
  CONSTRAINT fk_operational_email_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_operational_email_status CHECK (delivery_status IN ('pending', 'processing', 'sent', 'failed', 'cancelled', 'skipped'))
) ENGINE=InnoDB;
