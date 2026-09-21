const crypto = require('crypto');
const repository = require('./analytics.repository');

/**
 * Stores only a one-way hash of the browser's anonymous identifier. This lets
 * the dashboard calculate unique visitors without retaining a personal ID,
 * IP address, user agent, query string, or page content.
 */
async function track(payload) {
  const visitorHash = crypto.createHash('sha256').update(payload.visitor_id).digest('hex');
  await repository.record({
    eventType: payload.event_type,
    pagePath: payload.page_path,
    targetPath: payload.target_path,
    visitorHash
  });
  return { accepted: true };
}

module.exports = { track };
