const db = require('../config/database');

async function create(userId, type, title, message, linkUrl = null) {
  const result = await db.query(
    `INSERT INTO notifications (user_id, notification_type, title, message, link_url)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, type, title, message, linkUrl]
  );
  return result.insertId;
}

async function broadcast(userIds, type, title, message, linkUrl = null) {
  return Promise.all([...new Set(userIds)].map((userId) => create(userId, type, title, message, linkUrl)));
}

module.exports = { create, broadcast };
