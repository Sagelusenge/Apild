const db = require('../config/database');

async function enqueue(message) {
  const result = await db.query(
    `INSERT INTO operational_email_queue (
      email_kind, recipient_email, recipient_name, subject, text_body, html_body,
      scheduled_at, event_id, project_id, user_id, dedupe_key
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      scheduled_at = CASE WHEN delivery_status IN ('pending', 'failed') THEN VALUES(scheduled_at) ELSE scheduled_at END,
      delivery_status = CASE WHEN delivery_status = 'failed' THEN 'pending' ELSE delivery_status END,
      subject = CASE WHEN delivery_status IN ('pending', 'failed') THEN VALUES(subject) ELSE subject END,
      text_body = CASE WHEN delivery_status IN ('pending', 'failed') THEN VALUES(text_body) ELSE text_body END,
      html_body = CASE WHEN delivery_status IN ('pending', 'failed') THEN VALUES(html_body) ELSE html_body END,
      last_error = CASE WHEN delivery_status = 'failed' THEN NULL ELSE last_error END`,
    [
      message.kind, message.to, message.recipientName || null, message.subject,
      message.text, message.html, message.scheduledAt, message.eventId || null,
      message.projectId || null, message.userId || null, message.dedupeKey || null
    ]
  );
  return result;
}

function due(limit = 25) {
  return db.query(
    `SELECT * FROM operational_email_queue
      WHERE delivery_status = 'pending' AND scheduled_at <= CURRENT_TIMESTAMP
      ORDER BY scheduled_at ASC, id ASC
      LIMIT ?`,
    [limit]
  );
}

async function claim(id) {
  const result = await db.query(
    `UPDATE operational_email_queue
        SET delivery_status = 'processing', attempts = attempts + 1, last_error = NULL
      WHERE id = ? AND delivery_status = 'pending'`,
    [id]
  );
  return result.affectedRows > 0;
}

function markSent(id) {
  return db.query(
    `UPDATE operational_email_queue
        SET delivery_status = 'sent', sent_at = CURRENT_TIMESTAMP, last_error = NULL
      WHERE id = ?`,
    [id]
  );
}

function markSkipped(id) {
  return db.query(
    `UPDATE operational_email_queue
        SET delivery_status = 'skipped', last_error = 'SMTP indisponible ou envoi désactivé pour les tests'
      WHERE id = ?`,
    [id]
  );
}

function markFailed(id, error) {
  return db.query(
    `UPDATE operational_email_queue
        SET delivery_status = 'failed', last_error = ?
      WHERE id = ?`,
    [String(error?.message || error || 'Erreur de délivrance').slice(0, 500), id]
  );
}

function recoverStaleProcessing() {
  return db.query(
    `UPDATE operational_email_queue
        SET delivery_status = 'pending', last_error = 'Reprise automatique après interruption du service'
      WHERE delivery_status = 'processing'
        AND updated_at < DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 15 MINUTE)`
  );
}

function cancelPendingForEventParticipants(eventId, userIds) {
  if (!userIds.length) return Promise.resolve();
  const placeholders = userIds.map(() => '?').join(', ');
  return db.query(
    `UPDATE operational_email_queue
        SET delivery_status = 'cancelled'
      WHERE event_id = ?
        AND user_id IN (${placeholders})
        AND delivery_status = 'pending'`,
    [eventId, ...userIds]
  );
}

function meetingReminderRecipients() {
  return db.query(
    `SELECT e.id AS event_id, e.title, e.description, e.starts_at, e.ends_at,
            e.location, e.meeting_url, e.reminder_minutes,
            u.id AS user_id, u.first_name, u.last_name, u.email
       FROM events e
       JOIN event_participants ep ON ep.event_id = e.id
       JOIN users u ON u.id = ep.user_id
      WHERE e.deleted_at IS NULL
        AND e.status = 'scheduled'
        AND e.reminder_minutes > 0
        AND e.starts_at > CURRENT_TIMESTAMP
        AND e.starts_at <= DATE_ADD(CURRENT_TIMESTAMP, INTERVAL e.reminder_minutes MINUTE)
        AND u.deleted_at IS NULL
        AND u.status = 'active'`
  );
}

function projectsEndingSoonRecipients() {
  return db.query(
    `SELECT DISTINCT p.id AS project_id, p.reference, p.name, p.end_date,
            u.id AS user_id, u.first_name, u.last_name, u.email
       FROM projects p
       JOIN users u ON u.id = p.manager_id
      WHERE p.deleted_at IS NULL
        AND p.status IN ('active', 'planned', 'on_hold')
        AND p.end_date BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY)
        AND u.deleted_at IS NULL
        AND u.status = 'active'
      UNION
     SELECT DISTINCT p.id AS project_id, p.reference, p.name, p.end_date,
            u.id AS user_id, u.first_name, u.last_name, u.email
       FROM projects p
       JOIN user_roles ur ON 1 = 1
       JOIN roles r ON r.id = ur.role_id AND r.code = 'admin'
       JOIN users u ON u.id = ur.user_id
      WHERE p.deleted_at IS NULL
        AND p.status IN ('active', 'planned', 'on_hold')
        AND p.end_date BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY)
        AND u.deleted_at IS NULL
        AND u.status = 'active'`
  );
}

module.exports = {
  enqueue,
  due,
  claim,
  markSent,
  markSkipped,
  markFailed,
  recoverStaleProcessing,
  cancelPendingForEventParticipants,
  meetingReminderRecipients,
  projectsEndingSoonRecipients
};
