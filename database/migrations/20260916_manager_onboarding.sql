-- Keep the supplied demonstration manager aligned with the onboarding policy:
-- the first connection must end by choosing a private strong password.
UPDATE users
SET job_title = 'Manager APILD',
    must_change_password = TRUE
WHERE email = 'sagelusenge@gmail.com'
  AND deleted_at IS NULL;
