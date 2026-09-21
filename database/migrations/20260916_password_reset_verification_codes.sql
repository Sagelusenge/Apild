-- A reset code is stored only as a SHA-256 digest.  It expires quickly and
-- bounded attempts prevent a six-digit code from becoming an online oracle.
ALTER TABLE password_reset_tokens
  ADD COLUMN IF NOT EXISTS verification_code_hash CHAR(64) NULL AFTER token_hash;

ALTER TABLE password_reset_tokens
  ADD COLUMN IF NOT EXISTS verification_code_attempts TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER verification_code_hash;

CREATE INDEX IF NOT EXISTS idx_password_reset_code_lookup
  ON password_reset_tokens (user_id, verification_code_hash, used_at, expires_at);
