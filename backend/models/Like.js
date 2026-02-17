const pool = require('../config/db');

const Like = {
  // Check if user already liked a post
  exists: async (userId, postId) => {
    const result = await pool.query(
      'SELECT id FROM likes WHERE user_id = $1 AND post_id = $2',
      [userId, postId]
    );
    return result.rows.length > 0;
  },

  // Like a post
  create: async (userId, postId) => {
    await pool.query(
      'INSERT INTO likes (user_id, post_id) VALUES ($1, $2)',
      [userId, postId]
    );
  },

  // Unlike a post
  delete: async (userId, postId) => {
    await pool.query(
      'DELETE FROM likes WHERE user_id = $1 AND post_id = $2',
      [userId, postId]
    );
  },

  // Count likes for a post
  countByPost: async (postId) => {
    const result = await pool.query(
      'SELECT COUNT(*) FROM likes WHERE post_id = $1',
      [postId]
    );
    return parseInt(result.rows[0].count);
  },
};

module.exports = Like;