-- Personal task access for the two operational roles.
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('tasks.read', 'tasks.update')
WHERE r.code IN ('communication', 'rh');

-- Shares need their own dated events so the communication dashboard can
-- display a factual interaction trend instead of inventing historical data.
CREATE TABLE IF NOT EXISTS article_share_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  article_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_article_share_events_article
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  INDEX idx_article_share_events_date (created_at, article_id)
) ENGINE=InnoDB;
