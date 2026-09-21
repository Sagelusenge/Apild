const express = require('express');
const { z } = require('zod');
const controller = require('./role.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requirePermission } = require('../../middlewares/permission.middleware');
const { validate, validateCrudBody } = require('../../middlewares/validation.middleware');

const router = express.Router();
const config = { fields: ['code', 'name', 'description', 'is_system'], required: ['name'] };
const access = [authenticate, requirePermission('roles.manage')];
router.get('/permissions', ...access, controller.permissions);
router.get('/', ...access, controller.list);
router.get('/:id', ...access, controller.get);
router.post('/', ...access, validateCrudBody(config), controller.create);
router.put('/:id', ...access, validateCrudBody(config), controller.update);
router.patch('/:id', ...access, validateCrudBody(config, true), controller.update);
router.put('/:id/permissions', ...access, validate(z.object({ permission_ids: z.array(z.coerce.number().int().positive()) }).strict()), controller.setPermissions);
router.delete('/:id', ...access, controller.remove);

module.exports = router;
