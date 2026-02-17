const pool = require('../config/db');

const Follow = {
  // Check if follower already follows target
  exists: async (followerId, followingId) => {
    const result = await pool.query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );
    return result.rows.length > 0;
  },

  // Follow a user
  create: async (followerId, followingId) => {
    await pool.query(
      'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)',
      [followerId, followingId]
    );
  },

  // Unfollow a user
  delete: async (followerId, followingId) => {
    await pool.query(
      'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );
  },

  // Get follower count for a user
  countFollowers: async (userId) => {
    const result = await pool.query(
      'SELECT COUNT(*) FROM follows WHERE following_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count);
  },

  // Get list of followers (users who follow userId)
  getFollowers: async (userId) => {
    const result = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.avatar_url, u.bio
       FROM follows f
       JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  // Get list of following (users that userId follows)
  getFollowing: async (userId) => {
    const result = await pool.query(
      `SELECT u.id, u.username, u.full_name, u.avatar_url, u.bio
       FROM follows f
       JOIN users u ON f.following_id = u.id
       WHERE f.follower_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );
    return result.rows;
  },
};

module.exports = Follow;