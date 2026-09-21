const { createRepository } = require('../../utils/crudFactory');
const config = require('../../config/entities').projects;
const db = require('../../config/database');

const repository = createRepository(config);
repository.summary = async (id) => (await db.query('SELECT * FROM v_project_dashboard WHERE id = ?', [id]))[0] || null;
repository.members = (id) => db.query(
  `SELECT pm.*, u.first_name, u.last_name, u.email, u.job_title
     FROM project_members pm JOIN users u ON u.id = pm.user_id
    WHERE pm.project_id = ? ORDER BY u.last_name, u.first_name`, [id]
);
repository.upsertMember = (id, payload) => db.query(
  `INSERT INTO project_members (project_id, user_id, project_role, joined_at, left_at, allocation_percent)
   VALUES (?, ?, ?, COALESCE(?, CURRENT_DATE), ?, COALESCE(?, 100))
   ON DUPLICATE KEY UPDATE project_role=VALUES(project_role), joined_at=VALUES(joined_at), left_at=VALUES(left_at), allocation_percent=VALUES(allocation_percent)`,
  [id, payload.user_id, payload.project_role || null, payload.joined_at || null, payload.left_at || null, payload.allocation_percent ?? null]
);
repository.removeMember = (id, userId) => db.query('DELETE FROM project_members WHERE project_id = ? AND user_id = ?', [id, userId]);
repository.domains = (id) => db.query(
  `SELECT d.* FROM intervention_domains d JOIN project_domains pd ON pd.domain_id=d.id WHERE pd.project_id=? ORDER BY d.name`, [id]
);
repository.addDomain = (id, domainId) => db.query('INSERT IGNORE INTO project_domains (project_id, domain_id) VALUES (?, ?)', [id, domainId]);
repository.removeDomain = (id, domainId) => db.query('DELETE FROM project_domains WHERE project_id = ? AND domain_id = ?', [id, domainId]);

module.exports = repository;
