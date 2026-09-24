const express = require('express');

const router = express.Router();

router.use('/public', require('./public.routes'));
router.use('/analytics', require('../modules/analytics/analytics.routes'));
router.use('/auth', require('../modules/auth/auth.routes'));
router.use('/users', require('../modules/users/user.routes'));
router.use('/roles', require('../modules/roles/role.routes'));
router.use('/projects', require('../modules/projects/project.routes'));
router.use('/tasks', require('../modules/tasks/task.routes'));
router.use('/events', require('../modules/events/event.routes'));
router.use('/partners', require('../modules/partners/partner.routes'));
router.use('/interventions', require('../modules/interventions/intervention.routes'));
router.use('/articles', require('../modules/articles/article.routes'));
router.use('/media', require('../modules/media/media.routes'));
router.use('/newsletter', require('../modules/newsletter/newsletter.routes'));
router.use('/notifications', require('../modules/notifications/notification.routes'));
router.use('/documents', require('../modules/documents/document.routes'));
router.use('/reports', require('../modules/reports/report.routes'));
router.use('/statistics', require('../modules/statistics/statistics.routes'));
router.use('/contact', require('../modules/contact/contact.routes'));
router.use('/settings', require('../modules/settings/settings.routes'));
router.use('/audit-logs', require('./audit.routes'));
router.use('/hr', require('../modules/hr/hr.routes'));

module.exports = router;
