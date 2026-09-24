const express = require('express');
const db = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { success } = require('../utils/response');

const router = express.Router();

const projectSelect = `
  p.id,p.reference,p.name,p.description,p.objectives,p.status,p.start_date,p.end_date,
  p.country,p.province,p.territory,p.locality,
  CASE
    WHEN p.status = 'completed' THEN 100
    WHEN p.status IN ('draft','cancelled') OR p.start_date IS NULL OR p.end_date IS NULL THEN 0
    WHEN CURRENT_DATE >= p.end_date THEN 100
    WHEN CURRENT_DATE <= p.start_date THEN 0
    ELSE ROUND((DATEDIFF(CURRENT_DATE, p.start_date) * 100) / DATEDIFF(p.end_date, p.start_date), 2)
  END AS progress_percent`;

router.get('/projects', asyncHandler(async (_request, response) => {
  const rows = await db.query(`SELECT ${projectSelect} FROM projects p WHERE p.deleted_at IS NULL AND p.status IN ('active','completed') ORDER BY p.start_date DESC`);
  return success(response, rows);
}));
router.get('/projects/:id', asyncHandler(async (request, response) => {
  const rows = await db.query(`SELECT ${projectSelect} FROM projects p WHERE p.id=? AND p.deleted_at IS NULL AND p.status IN ('active','completed') LIMIT 1`, [request.params.id]);
  if (!rows[0]) throw new AppError('Projet introuvable', 404, 'NOT_FOUND');
  return success(response, rows[0]);
}));
router.get('/interventions', asyncHandler(async (_request, response) => success(response, await db.query(`SELECT i.id,i.reference,i.title,i.description,i.image_url,i.intervention_date,i.province,i.territory,i.locality,i.beneficiaries_men,i.beneficiaries_women,i.beneficiaries_children,d.name AS domain_name FROM interventions i JOIN intervention_domains d ON d.id=i.domain_id WHERE i.deleted_at IS NULL AND i.status='completed' ORDER BY i.intervention_date DESC`))));
router.get('/events', asyncHandler(async (_request, response) => success(response, await db.query(`SELECT id,project_id,title,description,event_type,starts_at,ends_at,location,meeting_url FROM events WHERE deleted_at IS NULL AND is_public=TRUE AND status='scheduled' AND ends_at>=CURRENT_TIMESTAMP ORDER BY starts_at`))));
router.get('/partners', asyncHandler(async (_request, response) => success(response, await db.query(`SELECT id,name,partner_type,description,website,logo_url FROM partners WHERE deleted_at IS NULL AND status='active' ORDER BY name`))));
router.get('/settings', asyncHandler(async (_request, response) => success(response, await db.query(`SELECT setting_key,setting_value,value_type,setting_group FROM settings WHERE is_public=TRUE ORDER BY setting_group,setting_key`))));
router.get('/impact', asyncHandler(async (_request, response) => {
  const rows = await db.query(`SELECT (SELECT COUNT(*) FROM projects WHERE deleted_at IS NULL AND status IN ('active','completed')) AS projects,(SELECT COUNT(*) FROM interventions WHERE deleted_at IS NULL AND status='completed') AS interventions,(SELECT COALESCE(SUM(COALESCE(beneficiaries_men,0)+COALESCE(beneficiaries_women,0)+COALESCE(beneficiaries_children,0)),0) FROM interventions WHERE deleted_at IS NULL AND status='completed') AS beneficiaries,(SELECT COUNT(*) FROM partners WHERE deleted_at IS NULL AND status='active') AS partners,(SELECT COUNT(*) FROM interventions WHERE deleted_at IS NULL AND status='completed' AND reference LIKE '%DEMO%') AS demo_interventions`);
  return success(response, rows[0]);
}));

module.exports = router;
