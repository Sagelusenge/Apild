-- APILD communication analytics rollout
-- Safe to run on an existing apild_platform database.
CREATE TABLE IF NOT EXISTS analytics_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(20) NOT NULL,
    page_path VARCHAR(240) NOT NULL,
    target_path VARCHAR(240) NULL,
    visitor_hash CHAR(64) NOT NULL,
    occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_analytics_event_type CHECK (event_type IN ('page_view', 'cta_click')),
    INDEX idx_analytics_event_date (event_type, occurred_at),
    INDEX idx_analytics_page_date (page_path, occurred_at),
    INDEX idx_analytics_visitor_date (visitor_hash, occurred_at)
) ENGINE=InnoDB;
