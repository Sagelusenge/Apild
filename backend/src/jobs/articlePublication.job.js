const cron = require('node-cron');
const logger = require('../utils/logger');
const { resumePending } = require('../modules/articles/article-publication.service');

// Recovers a delivery interrupted by a restart and retries transient SMTP failures.
module.exports = cron.createTask('*/10 * * * *', async () => {
  try {
    await resumePending();
  } catch (error) {
    logger.error({ err: error }, 'Échec du job de diffusion des publications');
  }
}, { timezone: 'Africa/Lubumbashi' });
