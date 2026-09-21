const db = require('../../config/database');

async function record({ eventType, pagePath, targetPath, visitorHash }) {
  await db.query(
    `INSERT INTO analytics_events (event_type, page_path, target_path, visitor_hash)
     VALUES (?, ?, ?, ?)`,
    [eventType, pagePath, targetPath || null, visitorHash]
  );
}

module.exports = { record };
