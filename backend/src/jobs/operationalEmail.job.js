const cron = require('node-cron');
const emailQueue = require('../services/operationalEmailQueue.service');
const logger = require('../utils/logger');

// A modest batch size protects the SMTP provider and prevents a single job
// run from becoming an accidental bulk-mail operation.
module.exports = cron.createTask('* * * * *', async () => {
  try {
    await emailQueue.queueDueMeetingReminders();
    await emailQueue.deliverDue(25);
  } catch (error) {
    logger.error({ err: error }, 'Échec du job des e-mails opérationnels');
  }
}, { timezone: 'Africa/Lubumbashi' });
