-- APILD Platform: consolidation Administration / Coordination and article notifications.
-- This migration is additive and safe to run more than once.

CREATE TABLE IF NOT EXISTS article_publication_notifications (
    article_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    notification_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    started_at DATETIME NULL,
    completed_at DATETIME NULL,
    total_recipients INT UNSIGNED NOT NULL DEFAULT 0,
    sent_count INT UNSIGNED NOT NULL DEFAULT 0,
    failed_count INT UNSIGNED NOT NULL DEFAULT 0,
    last_error VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_article_publication_notification_status
        CHECK (notification_status IN ('pending', 'sending', 'sent', 'failed')),
    CONSTRAINT fk_article_publication_notifications_article
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS article_publication_recipients (
    article_id BIGINT UNSIGNED NOT NULL,
    subscriber_id BIGINT UNSIGNED NOT NULL,
    delivery_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    sent_at DATETIME NULL,
    last_attempt_at DATETIME NULL,
    error_message VARCHAR(500) NULL,
    PRIMARY KEY (article_id, subscriber_id),
    CONSTRAINT chk_article_publication_recipient_status
        CHECK (delivery_status IN ('pending', 'sending', 'sent', 'failed')),
    CONSTRAINT fk_article_publication_recipients_article
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    CONSTRAINT fk_article_publication_recipients_subscriber
        FOREIGN KEY (subscriber_id) REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
    INDEX idx_article_publication_recipients_status (article_id, delivery_status)
) ENGINE=InnoDB;

-- Administration and project coordination are now a single operational actor.
INSERT IGNORE INTO user_roles (user_id, role_id, assigned_by)
SELECT manager_assignment.user_id, admin_role.id, manager_assignment.assigned_by
FROM user_roles manager_assignment
JOIN roles manager_role ON manager_role.id = manager_assignment.role_id AND manager_role.code = 'manager'
JOIN roles admin_role ON admin_role.code = 'admin';

DELETE FROM roles WHERE code = 'manager';

UPDATE roles
   SET name = 'Administration et coordination',
       description = 'Pilotage global, administration et coordination opérationnelle de la plateforme'
 WHERE code = 'admin';
