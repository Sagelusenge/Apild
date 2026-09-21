-- Public interactions for published news. Visitor identifiers are stored only
-- as irreversible hashes, so a single browser can like an article once
-- without creating a public user account.
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS likes_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER is_featured,
  ADD COLUMN IF NOT EXISTS shares_count INT UNSIGNED NOT NULL DEFAULT 0 AFTER likes_count;

CREATE TABLE IF NOT EXISTS article_comments (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  article_id BIGINT UNSIGNED NOT NULL,
  author_name VARCHAR(120) NOT NULL,
  author_email VARCHAR(190) NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'published',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_article_comments_status CHECK (status IN ('published', 'hidden')),
  CONSTRAINT fk_article_comments_article
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  INDEX idx_article_comments_public (article_id, status, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS article_reactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  article_id BIGINT UNSIGNED NOT NULL,
  visitor_hash CHAR(64) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_article_reactions_visitor UNIQUE (article_id, visitor_hash),
  CONSTRAINT fk_article_reactions_article
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  INDEX idx_article_reactions_article (article_id)
) ENGINE=InnoDB;
