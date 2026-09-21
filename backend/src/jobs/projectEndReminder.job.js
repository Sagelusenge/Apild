const cron = require('node-cron');
const emailQueue = require('../services/operationalEmailQueue.service');
const logger = require('../utils/logger');

module.exports = cron.createTask('0 7 * * *', async () => {
  try {
    await emailQueue.queueProjectsEndingSoon();
  } catch (error) {
    logger.error({ err: error }, 'Échec du job des échéances projet');
  }
}, { timezone: 'Africa/Lubumbashi' });
