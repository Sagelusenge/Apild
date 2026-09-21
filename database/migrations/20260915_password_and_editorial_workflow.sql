-- Account onboarding and editorial workflow safeguards.
-- Existing accounts remain usable; only passwords assigned after this migration
-- require the owner to choose a new password on their first connection.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE AFTER password_hash;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_changed_at DATETIME NULL AFTER must_change_password;

CREATE INDEX IF NOT EXISTS idx_users_must_change_password
  ON users (must_change_password, status);

-- These editorial cards intentionally restate APILD's public institutional
-- information. They are not presented as reports of unverified field events.
INSERT INTO article_categories (name, slug, description) VALUES
  ('Informations institutionnelles', 'informations-institutionnelles', 'Repères institutionnels et informations vérifiées sur APILD')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description);

INSERT INTO articles (
  reference, category_id, author_id, title, slug, excerpt, content,
  featured_image_url, status, is_featured, published_at
) VALUES
  (
    'ART-APILD-INFO-001',
    (SELECT id FROM article_categories WHERE slug = 'informations-institutionnelles' LIMIT 1),
    (SELECT id FROM users WHERE email = 'sagelusenge@gmail.com' AND deleted_at IS NULL LIMIT 1),
    'APILD : une ONG nationale au service des initiatives locales',
    'apild-ong-nationale-initiatives-locales',
    'Présentation institutionnelle d’APILD, organisation congolaise engagée pour le développement local.',
    '<p>APILD signifie Action pour la Promotion des Initiatives Locales de Développement.</p><p>L’organisation promeut et accompagne les initiatives locales de développement en République démocratique du Congo.</p>',
    '/images/site/news-community.jpg', 'published', TRUE, CURRENT_TIMESTAMP - INTERVAL 9 DAY
  ),
  (
    'ART-APILD-INFO-002',
    (SELECT id FROM article_categories WHERE slug = 'informations-institutionnelles' LIMIT 1),
    (SELECT id FROM users WHERE email = 'sagelusenge@gmail.com' AND deleted_at IS NULL LIMIT 1),
    'Une action ancrée à Goma, dans l’Est de la RDC',
    'action-ancree-goma-est-rdc',
    'Le siège social d’APILD est établi à Goma, dans la commune de Karisimbi.',
    '<p>APILD est une ONG nationale créée le 15 novembre 2022 à Goma.</p><p>Son siège social se situe à Goma, commune de Karisimbi, quartier Murara, avenue Mukosasenge.</p>',
    '/images/site/news-training.jpg', 'published', FALSE, CURRENT_TIMESTAMP - INTERVAL 8 DAY
  ),
  (
    'ART-APILD-INFO-003',
    (SELECT id FROM article_categories WHERE slug = 'informations-institutionnelles' LIMIT 1),
    (SELECT id FROM users WHERE email = 'sagelusenge@gmail.com' AND deleted_at IS NULL LIMIT 1),
    'Promouvoir des initiatives locales pour améliorer durablement les conditions de vie',
    'promouvoir-initiatives-locales-conditions-vie',
    'L’objectif général d’APILD vise les populations vulnérables touchées par les crises.',
    '<p>APILD contribue à promouvoir et accompagner les initiatives locales dans les domaines sociaux, économiques, de la formation, de l’insertion professionnelle et de l’environnement.</p><p>L’objectif est d’améliorer durablement les conditions de vie des populations vulnérables affectées par les crises en RDC.</p>',
    '/images/site/news-youth.jpg', 'published', FALSE, CURRENT_TIMESTAMP - INTERVAL 7 DAY
  ),
  (
    'ART-APILD-INFO-004',
    (SELECT id FROM article_categories WHERE slug = 'informations-institutionnelles' LIMIT 1),
    (SELECT id FROM users WHERE email = 'sagelusenge@gmail.com' AND deleted_at IS NULL LIMIT 1),
    'Renforcer les capacités communautaires grâce aux micro-projets durables',
    'renforcer-capacites-communautaires-micro-projets',
    'Le but d’APILD est d’accompagner la conception et la gestion de projets adaptés aux réalités locales.',
    '<p>APILD renforce les capacités communautaires dans la conception, le pilotage et la gestion de micro-projets durables.</p><p>Ces projets sont conçus avec les communautés, selon les réalités locales.</p>',
    '/images/site/project-training.jpg', 'published', FALSE, CURRENT_TIMESTAMP - INTERVAL 6 DAY
  ),
  (
    'ART-APILD-INFO-005',
    (SELECT id FROM article_categories WHERE slug = 'informations-institutionnelles' LIMIT 1),
    (SELECT id FROM users WHERE email = 'sagelusenge@gmail.com' AND deleted_at IS NULL LIMIT 1),
    'Nord-Kivu, Ituri et Sud-Kivu : les zones d’intervention APILD',
    'nord-kivu-ituri-sud-kivu-zones-intervention',
    'APILD intervient prioritairement dans trois provinces de l’Est de la RDC.',
    '<p>Les interventions d’APILD couvrent prioritairement le Nord-Kivu, l’Ituri et le Sud-Kivu.</p><p>L’organisation accompagne les communautés vivant dans des zones affectées par les crises.</p>',
    '/images/site/project-environment.jpg', 'published', FALSE, CURRENT_TIMESTAMP - INTERVAL 5 DAY
  ),
  (
    'ART-APILD-INFO-006',
    (SELECT id FROM article_categories WHERE slug = 'informations-institutionnelles' LIMIT 1),
    (SELECT id FROM users WHERE email = 'sagelusenge@gmail.com' AND deleted_at IS NULL LIMIT 1),
    'La participation : les communautés au cœur de l’action',
    'participation-communautes-coeur-action',
    'La participation est l’un des principes fondateurs d’APILD.',
    '<p>Pour APILD, les communautés sont au cœur de l’action.</p><p>La participation citoyenne et la gouvernance locale inclusive font partie de l’approche de l’organisation.</p>',
    '/images/site/hero-community.jpg', 'published', FALSE, CURRENT_TIMESTAMP - INTERVAL 4 DAY
  ),
  (
    'ART-APILD-INFO-007',
    (SELECT id FROM article_categories WHERE slug = 'informations-institutionnelles' LIMIT 1),
    (SELECT id FROM users WHERE email = 'sagelusenge@gmail.com' AND deleted_at IS NULL LIMIT 1),
    'Transparence : intégrité et responsabilité dans l’action locale',
    'transparence-integrite-responsabilite-action-locale',
    'APILD inscrit la transparence parmi ses principes fondateurs.',
    '<p>La transparence exprime l’exigence d’intégrité et de responsabilité dans les actions menées avec les communautés et les partenaires.</p>',
    '/images/site/testw1600h900rw.jpg', 'published', FALSE, CURRENT_TIMESTAMP - INTERVAL 3 DAY
  ),
  (
    'ART-APILD-INFO-008',
    (SELECT id FROM article_categories WHERE slug = 'informations-institutionnelles' LIMIT 1),
    (SELECT id FROM users WHERE email = 'sagelusenge@gmail.com' AND deleted_at IS NULL LIMIT 1),
    'Solidarité : la force du collectif pour impulser le changement',
    'solidarite-force-collectif-changement',
    'La solidarité soutient une réponse collective aux défis rencontrés par les populations vulnérables.',
    '<p>APILD présente la solidarité comme une force du collectif pour impulser le changement.</p><p>Cette valeur nourrit la coopération entre communautés, organisations locales et partenaires.</p>',
    '/images/site/news-community.jpg', 'published', FALSE, CURRENT_TIMESTAMP - INTERVAL 2 DAY
  ),
  (
    'ART-APILD-INFO-009',
    (SELECT id FROM article_categories WHERE slug = 'informations-institutionnelles' LIMIT 1),
    (SELECT id FROM users WHERE email = 'sagelusenge@gmail.com' AND deleted_at IS NULL LIMIT 1),
    'Durabilité : construire des impacts positifs à long terme',
    'durabilite-impacts-positifs-long-terme',
    'Les micro-projets accompagnés par APILD visent des résultats inclusifs et pérennes.',
    '<p>La durabilité représente la recherche d’impacts positifs à long terme.</p><p>APILD privilégie des micro-projets ancrés dans les réalités locales pour un développement inclusif et pérenne.</p>',
    '/images/site/project-health.jpg', 'published', FALSE, CURRENT_TIMESTAMP - INTERVAL 1 DAY
  ),
  (
    'ART-APILD-INFO-010',
    (SELECT id FROM article_categories WHERE slug = 'informations-institutionnelles' LIMIT 1),
    (SELECT id FROM users WHERE email = 'sagelusenge@gmail.com' AND deleted_at IS NULL LIMIT 1),
    'Une vision de communautés autonomes, résilientes et organisées',
    'vision-communautes-autonomes-resilientes-organisees',
    'La vision d’APILD est celle de communautés actrices de leur propre développement.',
    '<p>APILD porte la vision de communautés autonomes, résilientes et organisées, actrices de leur propre développement.</p><p>Cette vision s’inscrit dans la recherche d’un environnement stable, équitable et prospère.</p>',
    '/images/site/testw1920.jpg', 'published', FALSE, CURRENT_TIMESTAMP
  )
ON DUPLICATE KEY UPDATE
  category_id = VALUES(category_id),
  author_id = COALESCE(VALUES(author_id), author_id),
  title = VALUES(title),
  excerpt = VALUES(excerpt),
  content = VALUES(content),
  featured_image_url = VALUES(featured_image_url),
  status = VALUES(status),
  is_featured = VALUES(is_featured),
  published_at = COALESCE(published_at, VALUES(published_at));
