INSERT INTO roles (code, name, description, is_system) VALUES
  ('rh', 'Ressources humaines', 'Gestion des dossiers du personnel, des contrats et des conges', TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), is_system = TRUE;

INSERT INTO permissions (code, module, action, description) VALUES
  ('hr.manage', 'hr', 'manage', 'Gerer les dossiers RH et les conges')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.code IN ('admin', 'rh') AND p.code = 'hr.manage';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.code = 'rh' AND p.code = 'events.read';

CREATE TABLE IF NOT EXISTS hr_employee_profiles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reference VARCHAR(40) NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NOT NULL UNIQUE,
  department VARCHAR(120) NULL,
  position_title VARCHAR(160) NULL,
  contract_type VARCHAR(30) NOT NULL DEFAULT 'permanent',
  hire_date DATE NULL,
  contract_end_date DATE NULL,
  is_expatriate BOOLEAN NOT NULL DEFAULT FALSE,
  base_salary DECIMAL(18,2) NULL,
  salary_currency CHAR(3) NOT NULL DEFAULT 'CDF',
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_hr_employee_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT chk_hr_employee_contract_type CHECK (contract_type IN ('permanent', 'fixed_term', 'consultant')),
  CONSTRAINT chk_hr_employee_currency CHECK (salary_currency IN ('CDF', 'USD')),
  CONSTRAINT chk_hr_employee_salary CHECK (base_salary IS NULL OR base_salary >= 0),
  CONSTRAINT chk_hr_employee_contract_dates CHECK (contract_end_date IS NULL OR hire_date IS NULL OR contract_end_date >= hire_date),
  INDEX idx_hr_employee_contract_end (contract_end_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS hr_leave_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reference VARCHAR(40) NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NOT NULL,
  leave_type VARCHAR(30) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  decision_note TEXT NULL,
  created_by BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_hr_leave_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_hr_leave_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_hr_leave_type CHECK (leave_type IN ('annual', 'sick', 'maternity', 'paternity', 'unpaid', 'other')),
  CONSTRAINT chk_hr_leave_status CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  CONSTRAINT chk_hr_leave_dates CHECK (end_date >= start_date),
  INDEX idx_hr_leave_user_dates (user_id, start_date, end_date),
  INDEX idx_hr_leave_status (status)
) ENGINE=InnoDB;
