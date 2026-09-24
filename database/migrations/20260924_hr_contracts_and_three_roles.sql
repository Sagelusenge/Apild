ALTER TABLE roles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE roles SET is_active = CASE
  WHEN code IN ('admin', 'communication', 'rh') THEN TRUE
  ELSE FALSE
END;

INSERT INTO permissions (code, module, action, description)
VALUES ('events.read', 'events', 'read', 'Consulter son calendrier et ses reunions')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.code IN ('admin', 'communication', 'rh') AND p.code = 'events.read';

CREATE TABLE IF NOT EXISTS hr_contracts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reference VARCHAR(40) NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NOT NULL,
  contract_type VARCHAR(30) NOT NULL,
  position_title VARCHAR(160) NOT NULL,
  starts_on DATE NOT NULL,
  ends_on DATE NULL,
  monthly_salary DECIMAL(18,2) NULL,
  salary_currency CHAR(3) NOT NULL DEFAULT 'CDF',
  work_location VARCHAR(180) NULL,
  responsibilities TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  signed_on DATE NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_hr_contract_actor FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_hr_contract_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_hr_contract_type CHECK (contract_type IN ('permanent', 'fixed_term', 'consultant')),
  CONSTRAINT chk_hr_contract_status CHECK (status IN ('draft', 'active', 'ended')),
  CONSTRAINT chk_hr_contract_currency CHECK (salary_currency IN ('CDF', 'USD')),
  CONSTRAINT chk_hr_contract_salary CHECK (monthly_salary IS NULL OR monthly_salary >= 0),
  CONSTRAINT chk_hr_contract_dates CHECK (ends_on IS NULL OR ends_on >= starts_on),
  INDEX idx_hr_contract_user_dates (user_id, starts_on, ends_on),
  INDEX idx_hr_contract_status (status)
) ENGINE=InnoDB;
