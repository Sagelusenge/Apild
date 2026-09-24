const express = require('express');
const { z } = require('zod');
const db = require('../../config/database');
const AppError = require('../../utils/AppError');
const { createController, createRepository, createService, createCrudRouter } = require('../../utils/crudFactory');
const asyncHandler = require('../../utils/asyncHandler');
const { success } = require('../../utils/response');
const { authenticate } = require('../../middlewares/auth.middleware');
const { requireRole } = require('../../middlewares/role.middleware');
const { requirePermission } = require('../../middlewares/permission.middleware');
const { ACTIVE_ROLES } = require('../../config/activeRoles');
const pdfService = require('../../services/pdf.service');

const router = express.Router();
router.use(authenticate, requireRole('admin', 'rh'));

const access = {
  readPermission: 'hr.manage', createPermission: 'hr.manage',
  updatePermission: 'hr.manage', deletePermission: 'hr.manage', softDelete: true
};

const profiles = {
  ...access, table: 'hr_employee_profiles', entityName: 'dossier RH', referencePrefix: 'EMP',
  fields: ['reference', 'user_id', 'department', 'position_title', 'contract_type', 'hire_date', 'contract_end_date', 'is_expatriate', 'base_salary', 'salary_currency', 'notes'],
  required: ['user_id'], search: ['reference', 'department', 'position_title'],
  filters: ['user_id', 'contract_type', 'salary_currency', 'is_expatriate']
};

const leaves = {
  ...access, table: 'hr_leave_requests', entityName: 'conge', referencePrefix: 'LEA', actorField: 'created_by',
  fields: ['reference', 'user_id', 'leave_type', 'start_date', 'end_date', 'reason', 'status', 'decision_note'],
  required: ['user_id', 'leave_type', 'start_date', 'end_date'], search: ['reference', 'reason'],
  filters: ['user_id', 'leave_type', 'status']
};

const contracts = {
  ...access, table: 'hr_contracts', entityName: 'contrat RH', referencePrefix: 'CTR', actorField: 'created_by',
  fields: ['reference', 'user_id', 'contract_type', 'position_title', 'starts_on', 'ends_on', 'monthly_salary', 'salary_currency', 'work_location', 'responsibilities', 'status', 'signed_on'],
  required: ['user_id', 'contract_type', 'position_title', 'starts_on'],
  search: ['reference', 'position_title', 'work_location'], filters: ['user_id', 'contract_type', 'status']
};

const date = z.iso.date();
const text = (length) => z.string().trim().max(length);
const profileFields = z.object({
  user_id: z.coerce.number().int().positive(),
  department: text(120).optional(),
  position_title: text(160).optional(),
  contract_type: z.enum(['permanent', 'fixed_term', 'consultant']).optional(),
  hire_date: date.optional(),
  contract_end_date: date.optional(),
  is_expatriate: z.boolean().optional(),
  base_salary: z.coerce.number().nonnegative().max(999999999999).optional(),
  salary_currency: z.enum(['CDF', 'USD']).optional(),
  notes: text(5000).optional()
}).strict();
const leaveFields = z.object({
  user_id: z.coerce.number().int().positive(),
  leave_type: z.enum(['annual', 'sick', 'maternity', 'paternity', 'unpaid', 'other']),
  start_date: date,
  end_date: date,
  reason: text(5000).optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled']).optional(),
  decision_note: text(5000).optional()
}).strict();
const contractFields = z.object({
  user_id: z.coerce.number().int().positive(),
  contract_type: z.enum(['permanent', 'fixed_term', 'consultant']),
  position_title: text(160).min(1),
  starts_on: date,
  ends_on: date.optional(),
  monthly_salary: z.coerce.number().nonnegative().max(999999999999).optional(),
  salary_currency: z.enum(['CDF', 'USD']).optional(),
  work_location: text(180).optional(),
  responsibilities: text(10000).optional(),
  status: z.enum(['draft', 'active', 'ended']).optional(),
  signed_on: date.optional()
}).strict();

function checkDateRange(start, end) {
  if (start && end && new Date(end).getTime() < new Date(start).getTime()) {
    throw new AppError('La date de fin doit suivre la date de debut', 422, 'INVALID_DATE_RANGE');
  }
}

async function assertActiveActor(userId) {
  const rows = await db.query(
    `SELECT u.id FROM users u JOIN user_roles ur ON ur.user_id=u.id
     JOIN roles r ON r.id=ur.role_id
     WHERE u.id=? AND u.deleted_at IS NULL AND u.status='active'
       AND r.is_active=TRUE AND r.code IN (${ACTIVE_ROLES.map(() => '?').join(',')})
     LIMIT 1`,
    [userId, ...ACTIVE_ROLES]
  );
  if (!rows.length) throw new AppError('Choisissez un acteur actif avec un rôle autorisé', 422, 'INVALID_ACTOR');
}

async function checkApprovedLeaveOverlap(data, id = 0) {
  if (data.status !== 'approved') return;
  const rows = await db.query(
    `SELECT id FROM hr_leave_requests WHERE user_id=? AND status='approved' AND deleted_at IS NULL
     AND id<>? AND start_date<=? AND end_date>=? LIMIT 1`,
    [data.user_id, id, data.end_date, data.start_date]
  );
  if (rows.length) throw new AppError('Un conge approuve existe deja sur cette periode', 409, 'LEAVE_OVERLAP');
}

router.get('/users', requirePermission('hr.manage'), asyncHandler(async (_request, response) => success(response, await db.query(
  `SELECT DISTINCT u.id,u.first_name,u.last_name,u.email,u.job_title FROM users u
   JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.id=ur.role_id
   WHERE u.deleted_at IS NULL AND u.status='active' AND r.is_active=TRUE
     AND r.code IN (${ACTIVE_ROLES.map(() => '?').join(',')})
   ORDER BY u.first_name,u.last_name LIMIT 500`,
  ACTIVE_ROLES
))));

router.get('/overview', requirePermission('hr.manage'), asyncHandler(async (_request, response) => {
  const [employeeCount, pendingLeaves, expiringContracts] = await Promise.all([
    db.query('SELECT COUNT(*) AS total FROM hr_employee_profiles WHERE deleted_at IS NULL'),
    db.query("SELECT COUNT(*) AS total FROM hr_leave_requests WHERE deleted_at IS NULL AND status = 'pending'"),
    db.query(`SELECT p.reference, p.contract_end_date, u.first_name, u.last_name
      FROM hr_employee_profiles p JOIN users u ON u.id = p.user_id
      WHERE p.deleted_at IS NULL AND p.contract_end_date BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(), INTERVAL 60 DAY)
      ORDER BY p.contract_end_date ASC`)
  ]);
  return success(response, {
    employeeCount: Number(employeeCount[0].total),
    pendingLeaves: Number(pendingLeaves[0].total),
    expiringContracts
  });
}));

router.get('/contracts/:id/pdf', requirePermission('hr.manage'), asyncHandler(async (request, response) => {
  const rows = await db.query(
    `SELECT c.*,u.first_name,u.last_name,u.email,u.job_title,u.phone
     FROM hr_contracts c JOIN users u ON u.id=c.user_id
     WHERE c.id=? AND c.deleted_at IS NULL LIMIT 1`, [request.params.id]
  );
  if (!rows.length) throw new AppError('Contrat introuvable', 404, 'NOT_FOUND');
  const buffer = await pdfService.createContractPdf(rows[0]);
  response.setHeader('Content-Type', 'application/pdf');
  response.setHeader('Content-Disposition', `attachment; filename="${rows[0].reference}.pdf"`);
  response.send(buffer);
}));

for (const [path, config] of [['/employees', profiles], ['/leaves', leaves], ['/contracts', contracts]]) {
  const repository = createRepository(config);
  const base = createService(repository, config);
  const service = path === '/employees' ? {
    ...base,
    async create(data, user) {
      checkDateRange(data.hire_date, data.contract_end_date);
      const existing = await db.query('SELECT id FROM hr_employee_profiles WHERE user_id=? LIMIT 1', [data.user_id]);
      if (existing.length) throw new AppError('Cet acteur possede deja un dossier RH', 409, 'PROFILE_EXISTS');
      return base.create(data, user);
    },
    async update(id, data, user) {
      const current = await base.get(id);
      checkDateRange(data.hire_date || current.hire_date, data.contract_end_date || current.contract_end_date);
      return base.update(id, data, user);
    }
  } : path === '/leaves' ? {
    ...base,
    async create(data, user) {
      checkDateRange(data.start_date, data.end_date);
      await checkApprovedLeaveOverlap(data);
      return base.create(data, user);
    },
    async update(id, data, user) {
      const current = await base.get(id);
      const merged = { ...current, ...data };
      checkDateRange(merged.start_date, merged.end_date);
      await checkApprovedLeaveOverlap(merged, Number(id));
      return base.update(id, data, user);
    }
  } : {
    ...base,
    async create(data, user) {
      checkDateRange(data.starts_on, data.ends_on);
      await assertActiveActor(data.user_id);
      return base.create(data, user);
    },
    async update(id, data, user) {
      const current = await base.get(id);
      checkDateRange(data.starts_on || current.starts_on, data.ends_on || current.ends_on);
      if (data.user_id && Number(data.user_id) !== Number(current.user_id)) await assertActiveActor(data.user_id);
      return base.update(id, data, user);
    }
  };
  const schemas = path === '/employees'
    ? { create: profileFields, update: profileFields.partial() }
    : path === '/leaves' ? { create: leaveFields, update: leaveFields.partial() }
      : { create: contractFields, update: contractFields.partial() };
  router.get(path, requirePermission('hr.manage'), asyncHandler(async (request, response) => {
    const result = await repository.findAll(request.query);
    const userIds = [...new Set(result.rows.map((row) => row.user_id).filter(Boolean))];
    const users = userIds.length ? await db.query(
      `SELECT id,first_name,last_name FROM users WHERE id IN (${userIds.map(() => '?').join(',')})`, userIds
    ) : [];
    const names = new Map(users.map((user) => [Number(user.id), `${user.first_name} ${user.last_name}`.trim()]));
    return success(response, result.rows.map((row) => ({ ...row, user_name: names.get(Number(row.user_id)) || '—' })), 'Liste chargee', 200, result.meta);
  }));
  router.use(path, createCrudRouter(createController(service, config), config, schemas));
}

module.exports = router;
