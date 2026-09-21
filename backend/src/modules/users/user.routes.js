const express = require('express');
const controller = require('./user.controller');
const schemas = require('./user.validation');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requirePermission } = require('../../middlewares/permission.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validation.middleware');

const router = express.Router();
router.use(authenticate);
router.get('/', requirePermission('users.read'), controller.list);
router.get('/:id', requirePermission('users.read'), controller.get);
router.post('/', requirePermission('users.create'), validate(schemas.create), controller.create);
router.put('/:id', requirePermission('users.update'), validate(schemas.update), controller.update);
router.patch('/:id', requirePermission('users.update'), validate(schemas.update), controller.update);
// Account suspension is deliberately role-gated rather than permission-gated.
// A custom role with `users.update` must never be able to remove another user's access.
router.patch('/:id/block', requireRole('admin'), controller.block);
router.patch('/:id/unblock', requireRole('admin'), controller.unblock);
router.delete('/:id', requirePermission('users.delete'), controller.remove);

module.exports = router;
