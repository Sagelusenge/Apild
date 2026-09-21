const express = require('express');
const controller = require('./statistics.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requirePermission } = require('../../middlewares/permission.middleware');

const router = express.Router();
router.use(authenticate, requirePermission('statistics.read'));
router.get('/overview', controller.overview);
router.get('/projects', controller.projects);
router.get('/communication', controller.communication);
router.get('/communication-dashboard', controller.communicationDashboard);
router.get('/newsletters', controller.newsletters);

module.exports = router;
