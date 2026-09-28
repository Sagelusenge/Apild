const db = require('../../config/database');

async function overview() {
  const rows = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND status = 'active') AS active_users,
      (SELECT COUNT(*) FROM projects WHERE deleted_at IS NULL) AS total_projects,
      (SELECT COUNT(*) FROM projects WHERE deleted_at IS NULL AND status = 'active') AS active_projects,
      (SELECT COUNT(*) FROM tasks WHERE deleted_at IS NULL) AS total_tasks,
      (SELECT COUNT(*) FROM tasks WHERE deleted_at IS NULL AND status = 'completed') AS completed_tasks,
      (SELECT COUNT(*) FROM tasks WHERE deleted_at IS NULL AND due_date < CURRENT_DATE AND status NOT IN ('completed','cancelled')) AS overdue_tasks,
      (SELECT COUNT(*) FROM interventions WHERE deleted_at IS NULL) AS interventions,
      (SELECT COALESCE(SUM(beneficiaries_men + beneficiaries_women + beneficiaries_children), 0) FROM interventions WHERE deleted_at IS NULL) AS beneficiaries,
      (SELECT COUNT(*) FROM partners WHERE deleted_at IS NULL AND status = 'active') AS active_partners
  `);
  return rows[0];
}

const projects = () => db.query('SELECT * FROM v_project_dashboard ORDER BY id DESC');
const communication = async () => (await db.query('SELECT * FROM v_communication_statistics'))[0];
const newsletters = () => db.query('SELECT * FROM v_newsletter_statistics ORDER BY sent_at DESC');

async function communicationDashboard() {
  const [summaryRows, popularPages, clickTargets, audienceSeries, engagementSeries] = await Promise.all([
    db.query(`
      SELECT
        (SELECT COUNT(*) FROM analytics_events
          WHERE event_type = 'page_view' AND occurred_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 DAY)) AS page_views_30_days,
        (SELECT COUNT(DISTINCT visitor_hash) FROM analytics_events
          WHERE event_type = 'page_view' AND occurred_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 DAY)) AS visitors_30_days,
        (SELECT COUNT(*) FROM analytics_events
          WHERE event_type = 'cta_click' AND occurred_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 DAY)) AS clicks_30_days,
        (SELECT COUNT(*) FROM newsletter_subscribers
          WHERE subscribed_at >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')) AS subscriptions_current_month,
        (SELECT COUNT(*) FROM newsletter_subscribers
          WHERE subscribed_at >= DATE_FORMAT(CURRENT_DATE - INTERVAL 1 MONTH, '%Y-%m-01')
            AND subscribed_at < DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')) AS subscriptions_previous_month,
        (SELECT COUNT(*) FROM newsletter_subscribers
          WHERE subscribed_at >= DATE_FORMAT(CURRENT_DATE - INTERVAL 1 MONTH, '%Y-%m-01')) AS subscriptions_last_two_months,
        (SELECT COUNT(*) FROM newsletter_subscribers WHERE status = 'active') AS active_subscribers,
        (SELECT COUNT(*) FROM articles WHERE deleted_at IS NULL AND status = 'published') AS published_articles,
        (SELECT COUNT(*) FROM articles WHERE deleted_at IS NULL AND status = 'published'
          AND published_at >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')) AS published_current_month,
        (SELECT COUNT(*) FROM articles WHERE deleted_at IS NULL AND status = 'draft') AS draft_articles,
        (SELECT COUNT(*) FROM articles WHERE deleted_at IS NULL AND status = 'review') AS review_articles
        ,(SELECT COALESCE(SUM(likes_count), 0) FROM articles WHERE deleted_at IS NULL) AS total_likes
        ,(SELECT COALESCE(SUM(shares_count), 0) FROM articles WHERE deleted_at IS NULL) AS total_shares
        ,(SELECT COUNT(*) FROM article_comments WHERE status = 'published') AS total_comments
    `),
    db.query(`
      SELECT page_path, COUNT(*) AS views, COUNT(DISTINCT visitor_hash) AS visitors
      FROM analytics_events
      WHERE event_type = 'page_view' AND occurred_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 DAY)
      GROUP BY page_path
      ORDER BY views DESC, visitors DESC, page_path ASC
      LIMIT 5
    `),
    db.query(`
      SELECT target_path, COUNT(*) AS clicks
      FROM analytics_events
      WHERE event_type = 'cta_click' AND target_path IS NOT NULL
        AND occurred_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 30 DAY)
      GROUP BY target_path
      ORDER BY clicks DESC, target_path ASC
      LIMIT 5
    `),
    db.query(`
      SELECT DATE(occurred_at) AS day,
             SUM(event_type = 'page_view') AS views,
             COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN visitor_hash END) AS visitors,
             SUM(event_type = 'cta_click') AS clicks
      FROM analytics_events
      WHERE occurred_at >= DATE_SUB(CURRENT_DATE, INTERVAL 29 DAY)
      GROUP BY DATE(occurred_at)
      ORDER BY day ASC
    `),
    db.query(`
      SELECT day, SUM(likes) AS likes, SUM(comments) AS comments, SUM(shares) AS shares
      FROM (
        SELECT DATE(created_at) AS day, COUNT(*) AS likes, 0 AS comments, 0 AS shares
        FROM article_reactions
        WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 29 DAY)
        GROUP BY DATE(created_at)
        UNION ALL
        SELECT DATE(created_at) AS day, 0 AS likes, COUNT(*) AS comments, 0 AS shares
        FROM article_comments
        WHERE status = 'published' AND created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 29 DAY)
        GROUP BY DATE(created_at)
        UNION ALL
        SELECT DATE(created_at) AS day, 0 AS likes, 0 AS comments, COUNT(*) AS shares
        FROM article_share_events
        WHERE created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 29 DAY)
        GROUP BY DATE(created_at)
      ) daily
      GROUP BY day
      ORDER BY day ASC
    `)
  ]);

  return {
    ...summaryRows[0],
    popular_pages: popularPages,
    click_targets: clickTargets,
    audience_series: audienceSeries,
    engagement_series: engagementSeries
  };
}

module.exports = { overview, projects, communication, communicationDashboard, newsletters };
