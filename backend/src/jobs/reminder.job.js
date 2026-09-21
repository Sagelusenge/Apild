const cron = require('node-cron');
const db = require('../config/database');
const notificationService = require('../services/pushNotification.service');
const logger = require('../utils/logger');

module.exports = cron.createTask('0 7 * * *', async () => {
  try {
    const tasks = await db.query(`
      SELECT t.id, t.reference, t.title, t.due_date, ta.user_id
        FROM tasks t JOIN task_assignees ta ON ta.task_id = t.id
       WHERE t.deleted_at IS NULL
         AND t.status NOT IN ('completed', 'cancelled')
         AND t.due_date BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY)
    `);
    await Promise.all(tasks.map((task) => notificationService.create(
      task.user_id, 'task_reminder', 'Echeance proche',
      `${task.reference} - ${task.title} arrive a echeance le ${task.due_date}.`, `/tasks/${task.id}`
    )));
  } catch (error) { logger.error({ err: error }, 'Echec du job de rappels'); }
}, { timezone: 'Africa/Lubumbashi' });
