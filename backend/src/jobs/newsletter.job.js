const cron = require('node-cron');
const db = require('../config/database');
const logger = require('../utils/logger');

module.exports = cron.createTask('*/5 * * * *', async () => {
  try {
    await db.query(`
      UPDATE newsletters
         SET status = 'sending'
       WHERE status = 'scheduled' AND scheduled_at <= CURRENT_TIMESTAMP
    `);
  } catch (error) { logger.error({ err: error }, 'Echec du job newsletter'); }
}, { timezone: 'Africa/Lubumbashi' });
