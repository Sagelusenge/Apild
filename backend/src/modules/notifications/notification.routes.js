const express = require('express');
const { z } = require('zod');
const controller = require('./notification.controller');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { validate } = require('../../middlewares/validation.middleware');

const router = express.Router();
router.use(authenticate);
router.get('/', controller.list);
router.patch('/read-all', controller.markAllRead);
router.get('/:id', controller.get);
router.post('/', requireRole('admin'), validate(z.object({
  user_id: z.coerce.number().int().positive(),
  notification_type: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  message: z.string().min(1),
  link_url: z.string().max(500).nullable().optional()
}).strict()), controller.create);
router.put('/:id', validate(z.object({ is_read: z.boolean() }).strict()), controller.update);
router.patch('/:id', validate(z.object({ is_read: z.boolean() }).strict()), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
