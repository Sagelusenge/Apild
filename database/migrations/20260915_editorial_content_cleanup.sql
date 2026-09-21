-- The original demonstration posts are retained for traceability but are not
-- public content. They are replaced by verified APILD institutional material.
UPDATE articles
   SET status = 'archived',
       featured_image_url = '/images/site/news-training.jpg'
 WHERE reference = 'ART-DEMO-001';

UPDATE articles
   SET status = 'archived',
       featured_image_url = '/images/site/news-community.jpg'
 WHERE reference = 'ART-DEMO-002';

INSERT INTO articles (
  reference, category_id, author_id, title, slug, excerpt, content,
  featured_image_url, status, is_featured, published_at
) VALUES
  (
    'ART-APILD-INFO-011',
    (SELECT id FROM article_categories WHERE slug = 'informations-institutionnelles' LIMIT 1),
    (SELECT id FROM users WHERE email = 'sagelusenge@gmail.com' AND deleted_at IS NULL LIMIT 1),
    'Les axes d’action d’APILD pour les populations vulnérables',
    'axes-action-apild-populations-vulnerables',
    'APILD agit contre la souffrance, la pauvreté et l’oppression des populations vulnérables.',
    '<p>APILD vise à soulager la souffrance, la pauvreté et l’oppression des populations vulnérables.</p><p>L’organisation renforce également les compétences communautaires en conception, mise en œuvre et évaluation de projets.</p>',
    '/images/site/news-youth.jpg', 'published', FALSE, CURRENT_TIMESTAMP - INTERVAL 11 DAY
  ),
  (
    'ART-APILD-INFO-012',
    (SELECT id FROM article_categories WHERE slug = 'informations-institutionnelles' LIMIT 1),
    (SELECT id FROM users WHERE email = 'sagelusenge@gmail.com' AND deleted_at IS NULL LIMIT 1),
    'Innovation sociale et partenariats au service du développement local',
    'innovation-sociale-partenariats-developpement-local',
    'APILD encourage l’innovation sociale et les partenariats multi-acteurs.',
    '<p>APILD stimule l’innovation sociale et les partenariats multi-acteurs.</p><p>Cette approche complète la promotion de la participation citoyenne et de la gouvernance locale inclusive.</p>',
    '/images/site/project-environment.jpg', 'published', FALSE, CURRENT_TIMESTAMP - INTERVAL 10 DAY
  )
ON DUPLICATE KEY UPDATE
  category_id = VALUES(category_id),
  author_id = COALESCE(VALUES(author_id), author_id),
  title = VALUES(title),
  excerpt = VALUES(excerpt),
  content = VALUES(content),
  featured_image_url = VALUES(featured_image_url),
  status = VALUES(status),
  published_at = COALESCE(published_at, VALUES(published_at));
