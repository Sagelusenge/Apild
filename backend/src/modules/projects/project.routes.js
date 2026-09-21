const controller = require('./project.controller');
const { createCrudRouter } = require('../../utils/crudFactory');
const config = require('../../config/entities').projects;
const schemas = require('./project.validation');
const { z } = require('zod');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requirePermission } = require('../../middlewares/permission.middleware');
const { validate } = require('../../middlewares/validation.middleware');

const router = createCrudRouter(controller, config, schemas);
router.get('/:id/summary', authenticate, requirePermission('projects.read'), controller.summary);
router.get('/:id/members', authenticate, requirePermission('projects.read'), controller.members);
router.post('/:id/members', authenticate, requirePermission('projects.update'), validate(z.object({ user_id: z.coerce.number().int().positive(), project_role: z.string().max(100).nullable().optional(), joined_at: z.string().optional(), left_at: z.string().nullable().optional(), allocation_percent: z.coerce.number().min(0).max(100).optional() }).strict()), controller.upsertMember);
router.delete('/:id/members/:userId', authenticate, requirePermission('projects.update'), controller.removeMember);
router.get('/:id/domains', authenticate, requirePermission('projects.read'), controller.domains);
router.post('/:id/domains', authenticate, requirePermission('projects.update'), validate(z.object({ domain_id: z.coerce.number().int().positive() }).strict()), controller.addDomain);
router.delete('/:id/domains/:domainId', authenticate, requirePermission('projects.update'), controller.removeDomain);

module.exports = router;
