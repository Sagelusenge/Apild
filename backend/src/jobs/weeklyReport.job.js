const cron = require('node-cron');
const db = require('../config/database');
const logger = require('../utils/logger');

module.exports = cron.createTask('0 8 * * 1', async () => {
  try {
    const admins = await db.query(`
      SELECT DISTINCT u.id FROM users u
      JOIN user_roles ur ON ur.user_id = u.id
      JOIN roles r ON r.id = ur.role_id
      WHERE r.code = 'admin' AND u.status = 'active' AND u.deleted_at IS NULL
    `);
    for (const admin of admins) {
      await db.query(
        `INSERT INTO notifications (user_id, notification_type, title, message, link_url)
         VALUES (?, 'weekly_report', 'Rapport hebdomadaire disponible', 'Les indicateurs de la semaine sont disponibles.', '/reports')`,
        [admin.id]
      );
    }
  } catch (error) { logger.error({ err: error }, 'Echec du job de rapport hebdomadaire'); }
}, { timezone: 'Africa/Lubumbashi' });
