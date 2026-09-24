ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS share_scope VARCHAR(20) NOT NULL DEFAULT 'private' AFTER is_public;

CREATE TABLE IF NOT EXISTS document_recipients (
  document_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  shared_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (document_id, user_id),
  CONSTRAINT fk_document_recipients_document
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  CONSTRAINT fk_document_recipients_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_document_recipients_sharer
    FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_document_recipients_user (user_id, document_id)
) ENGINE=InnoDB;

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code = 'documents.read'
WHERE r.code IN ('communication', 'rh');
