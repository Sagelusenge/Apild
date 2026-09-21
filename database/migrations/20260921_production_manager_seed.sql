-- Premier compte de gestion pour une base APILD nouvellement initialisée.
-- Le mot de passe temporaire impose immédiatement le choix d’un mot de passe fort.
INSERT IGNORE INTO users (
  first_name, last_name, email, password_hash, must_change_password,
  job_title, status, email_verified_at
) VALUES (
  'Sagel', 'Usenge', 'sagelusenge@gmail.com',
  '$2b$12$WqdUU14qe/KfFor4LGb53umuZY5DWG7WcxkJBD/NMilwz8uUp2dX2', TRUE,
  'Manager APILD', 'active', CURRENT_TIMESTAMP
);

INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.code = 'admin'
WHERE u.email = 'sagelusenge@gmail.com'
  AND u.deleted_at IS NULL;

-- Les comptes de démonstration ne doivent pas être utilisables sur l’instance publique.
UPDATE users
SET status = 'inactive'
WHERE email LIKE '%@apild.test'
  AND deleted_at IS NULL;
