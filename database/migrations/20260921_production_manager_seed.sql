-- Les comptes de démonstration ne doivent pas être utilisables sur l’instance publique.
UPDATE users
SET status = 'inactive'
WHERE email LIKE '%@apild.test'
  AND deleted_at IS NULL;
