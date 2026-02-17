const pool = require('../config/db');

const User = {
  // Find user by email
  findByEmail: async (email) => {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    return result.rows[0] || null;
  },

  // Find user by username
  findByUsername: async (username) => {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.full_name, u.bio, u.avatar_url, u.website, u.created_at,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following_count,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND is_published = true) AS posts_count
       FROM users u WHERE u.username = $1`,
      [username.toLowerCase()]
    );
    return result.rows[0] || null;
  },

  // Find user by id
  findById: async (id) => {
    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.full_name, u.bio, u.avatar_url, u.website, u.created_at,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers_count,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following_count,
        (SELECT COUNT(*) FROM posts WHERE user_id = u.id AND is_published = true) AS posts_count
       FROM users u WHERE u.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  // Check if email or username already exists
  existsByEmailOrUsername: async (email, username) => {
    const result = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email.toLowerCase(), username.toLowerCase()]
    );
    return result.rows.length > 0;
  },

  // Create a new user
  create: async ({ username, email, password_hash, full_name, avatar_url }) => {
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, avatar_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, full_name, avatar_url, bio, created_at`,
      [username.toLowerCase(), email.toLowerCase(), password_hash, full_name, avatar_url]
    );
    return result.rows[0];
  },

  // Update profile fields
  update: async (id, { full_name, bio, website, avatar_url }) => {
    const result = await pool.query(
      `UPDATE users
       SET full_name   = COALESCE($1, full_name),
           bio         = COALESCE($2, bio),
           website     = COALESCE($3, website),
           avatar_url  = COALESCE($4, avatar_url)
       WHERE id = $5
       RETURNING id, username, email, full_name, bio, avatar_url, website`,
      [full_name, bio, website, avatar_url, id]
    );
    return result.rows[0];
  },

  // Search users by username or full_name
  search: async (query = '') => {
    const result = await pool.query(
      `SELECT id, username, full_name, avatar_url, bio,
        (SELECT COUNT(*) FROM follows WHERE following_id = users.id) AS followers_count
       FROM users
       WHERE username ILIKE $1 OR full_name ILIKE $1
       ORDER BY followers_count DESC
       LIMIT 20`,
      [`%${query}%`]
    );
    return result.rows;
  },
};

module.exports = User;