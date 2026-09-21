const db = require('../../config/database');

async function findPublishedArticle(id) {
  const rows = await db.query(
    "SELECT id FROM articles WHERE id = ? AND status = 'published' AND deleted_at IS NULL LIMIT 1",
    [id]
  );
  return rows[0] || null;
}

async function feedbackSummary(articleId) {
  const rows = await db.query(`
    SELECT a.id,
           a.likes_count,
           a.shares_count,
           (
             SELECT COUNT(*)
               FROM article_comments c
              WHERE c.article_id = a.id
                AND c.status = 'published'
           ) AS comments_count
      FROM articles a
     WHERE a.id = ?
       AND a.status = 'published'
       AND a.deleted_at IS NULL
     LIMIT 1
  `, [articleId]);
  return rows[0] || null;
}

async function hasReaction(articleId, visitorHash) {
  const rows = await db.query(
    'SELECT id FROM article_reactions WHERE article_id = ? AND visitor_hash = ? LIMIT 1',
    [articleId, visitorHash]
  );
  return Boolean(rows[0]);
}

async function listComments(articleId, { limit, offset }) {
  const countRows = await db.query(
    "SELECT COUNT(*) AS total FROM article_comments WHERE article_id = ? AND status = 'published'",
    [articleId]
  );
  const rows = await db.query(`
    SELECT id, author_name, content, created_at
      FROM article_comments
     WHERE article_id = ?
       AND status = 'published'
     ORDER BY created_at DESC, id DESC
     LIMIT ? OFFSET ?
  `, [articleId, limit, offset]);
  return { rows, total: Number(countRows[0]?.total || 0) };
}

async function createComment(articleId, comment) {
  const result = await db.query(
    `INSERT INTO article_comments (article_id, author_name, author_email, content)
     VALUES (?, ?, ?, ?)`,
    [articleId, comment.author_name, comment.author_email || null, comment.content]
  );
  const rows = await db.query(
    'SELECT id, author_name, content, created_at FROM article_comments WHERE id = ? LIMIT 1',
    [result.insertId]
  );
  return rows[0] || null;
}

async function toggleReaction(articleId, visitorHash) {
  return db.transaction(async (connection) => {
    const [articles] = await connection.execute(
      "SELECT id FROM articles WHERE id = ? AND status = 'published' AND deleted_at IS NULL FOR UPDATE",
      [articleId]
    );
    if (!articles[0]) return null;

    const [inserted] = await connection.execute(
      'INSERT IGNORE INTO article_reactions (article_id, visitor_hash) VALUES (?, ?)',
      [articleId, visitorHash]
    );
    let liked = inserted.affectedRows === 1;
    if (liked) {
      await connection.execute('UPDATE articles SET likes_count = likes_count + 1 WHERE id = ?', [articleId]);
    } else {
      const [removed] = await connection.execute(
        'DELETE FROM article_reactions WHERE article_id = ? AND visitor_hash = ?',
        [articleId, visitorHash]
      );
      if (removed.affectedRows) {
        await connection.execute('UPDATE articles SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = ?', [articleId]);
      } else {
        liked = Boolean((await connection.execute(
          'SELECT id FROM article_reactions WHERE article_id = ? AND visitor_hash = ? LIMIT 1',
          [articleId, visitorHash]
        ))[0][0]);
      }
    }

    const [rows] = await connection.execute(`
      SELECT a.likes_count,
             a.shares_count,
             (SELECT COUNT(*) FROM article_comments c WHERE c.article_id = a.id AND c.status = 'published') AS comments_count
        FROM articles a
       WHERE a.id = ?
       LIMIT 1
    `, [articleId]);
    return { ...(rows[0] || {}), liked };
  });
}

async function registerShare(articleId) {
  const result = await db.query(
    "UPDATE articles SET shares_count = shares_count + 1 WHERE id = ? AND status = 'published' AND deleted_at IS NULL",
    [articleId]
  );
  if (!result.affectedRows) return null;
  return feedbackSummary(articleId);
}

module.exports = {
  findPublishedArticle,
  feedbackSummary,
  hasReaction,
  listComments,
  createComment,
  toggleReaction,
  registerShare
};
