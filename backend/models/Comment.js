const pool = require('../config/db');

const Comment = {
  // Get all comments for a post (with author info)
  findByPost: async (postId) => {
    const result = await pool.query(
      `SELECT c.id, c.content, c.created_at, c.user_id, c.post_id,
              u.username, u.full_name, u.avatar_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [postId]
    );
    return result.rows;
  },

  // Create a comment and return it with author info
  create: async (userId, postId, content) => {
    const ins = await pool.query(
      'INSERT INTO comments (user_id, post_id, content) VALUES ($1, $2, $3) RETURNING id',
      [userId, postId, content]
    );
    const result = await pool.query(
      `SELECT c.id, c.content, c.created_at, c.user_id, c.post_id,
              u.username, u.full_name, u.avatar_url
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [ins.rows[0].id]
    );
    return result.rows[0];
  },

  // Get owner of a comment
  getOwnerId: async (commentId) => {
    const result = await pool.query(
      'SELECT user_id FROM comments WHERE id = $1',
      [commentId]
    );
    return result.rows[0]?.user_id || null;
  },

  // Delete a comment
  delete: async (commentId) => {
    await pool.query('DELETE FROM comments WHERE id = $1', [commentId]);
  },
};

module.exports = Comment;