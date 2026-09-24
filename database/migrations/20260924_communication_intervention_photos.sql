ALTER TABLE interventions ADD COLUMN IF NOT EXISTS image_url VARCHAR(500) NULL;

INSERT INTO permissions (code, module, action, description) VALUES
  ('interventions.create', 'interventions', 'create', 'Creer une intervention'),
  ('interventions.update', 'interventions', 'update', 'Modifier une intervention')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.code = 'admin' AND p.code IN ('interventions.create', 'interventions.update');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.code = 'communication' AND p.code IN ('interventions.create', 'interventions.update');
