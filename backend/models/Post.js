const pool = require('../config/db');
const slugify = require('slugify');

// Helper: calculate read time from HTML content
const calcReadTime = (content) => {
  const text = content.replace(/<[^>]*>/g, '');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

// Helper: generate unique slug
const generateSlug = async (title, excludeId = null) => {
  let slug = slugify(title, { lower: true, strict: true });
  let counter = 0;
  while (true) {
    const testSlug = counter === 0 ? slug : `${slug}-${counter}`;
    const query = excludeId
      ? 'SELECT id FROM posts WHERE slug = $1 AND id != $2'
      : 'SELECT id FROM posts WHERE slug = $1';
    const params = excludeId ? [testSlug, excludeId] : [testSlug];
    const result = await pool.query(query, params);
    if (result.rows.length === 0) return testSlug;
    counter++;
  }
};

// Reusable SELECT columns for post listings
const POST_LIST_FIELDS = `
  p.id, p.title, p.slug, p.excerpt, p.cover_image,
  p.tags, p.read_time, p.created_at, p.updated_at,
  u.id AS author_id, u.username, u.full_name, u.avatar_url,
  COUNT(DISTINCT l.id)  AS likes_count,
  COUNT(DISTINCT c.id)  AS comments_count
`;

const Post = {
  // Get paginated feed (all or following)
  findAll: async ({ page = 1, limit = 12, feed = 'all', userId = null, tag = null, search = null }) => {
    const offset = (page - 1) * limit;
    const params = [];
    let paramIdx = 1;
    let whereClause = 'WHERE p.is_published = true';

    if (feed === 'following' && userId) {
      whereClause += ` AND p.user_id IN (SELECT following_id FROM follows WHERE follower_id = $${paramIdx++})`;
      params.push(userId);
    }
    if (tag) {
      whereClause += ` AND $${paramIdx++} = ANY(p.tags)`;
      params.push(tag);
    }
    if (search) {
      whereClause += ` AND (p.title ILIKE $${paramIdx} OR p.excerpt ILIKE $${paramIdx++})`;
      params.push(`%${search}%`);
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM posts p ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const likeJoin = userId
      ? `LEFT JOIN likes ul ON ul.post_id = p.id AND ul.user_id = ${userId}`
      : '';
    const likeSelect = userId
      ? ', CASE WHEN ul.id IS NOT NULL THEN true ELSE false END AS is_liked'
      : ', false AS is_liked';
    const likeGroup = userId ? ', ul.id' : '';

    const result = await pool.query(
      `SELECT ${POST_LIST_FIELDS} ${likeSelect}
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN likes l ON l.post_id = p.id
       LEFT JOIN comments c ON c.post_id = p.id
       ${likeJoin}
       ${whereClause}
       GROUP BY p.id, u.id ${likeGroup}
       ORDER BY p.created_at DESC
       LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limit, offset]
    );

    return { posts: result.rows, total };
  },

  // Get single post by slug (with full content)
  findBySlug: async (slug, userId = null) => {
    const likeJoin = userId
      ? `LEFT JOIN likes ul ON ul.post_id = p.id AND ul.user_id = ${userId}`
      : '';
    const likeSelect = userId
      ? ', CASE WHEN ul.id IS NOT NULL THEN true ELSE false END AS is_liked'
      : ', false AS is_liked';
    const likeGroup = userId ? ', ul.id' : '';

    const result = await pool.query(
      `SELECT p.*, u.id AS author_id, u.username, u.full_name, u.avatar_url, u.bio AS author_bio,
              COUNT(DISTINCT l.id) AS likes_count,
              COUNT(DISTINCT c.id) AS comments_count
              ${likeSelect}
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN likes l ON l.post_id = p.id
       LEFT JOIN comments c ON c.post_id = p.id
       ${likeJoin}
       WHERE p.slug = $1 AND p.is_published = true
       GROUP BY p.id, u.id ${likeGroup}`,
      [slug]
    );
    return result.rows[0] || null;
  },

  // Get posts by userId (for profile page)
  findByUserId: async ({ userId, page = 1, limit = 12, currentUserId = null }) => {
    const offset = (page - 1) * limit;

    const likeJoin = currentUserId
      ? `LEFT JOIN likes ul ON ul.post_id = p.id AND ul.user_id = ${currentUserId}`
      : '';
    const likeSelect = currentUserId
      ? ', CASE WHEN ul.id IS NOT NULL THEN true ELSE false END AS is_liked'
      : ', false AS is_liked';
    const likeGroup = currentUserId ? ', ul.id' : '';

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM posts WHERE user_id = $1 AND is_published = true',
      [userId]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT ${POST_LIST_FIELDS} ${likeSelect}
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN likes l ON l.post_id = p.id
       LEFT JOIN comments c ON c.post_id = p.id
       ${likeJoin}
       WHERE p.user_id = $1 AND p.is_published = true
       GROUP BY p.id, u.id ${likeGroup}
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return { posts: result.rows, total };
  },

  // Create a new post
  create: async ({ userId, title, content, excerpt, cover_image, tags, is_published }) => {
    const slug = await generateSlug(title);
    const read_time = calcReadTime(content);
    const autoExcerpt = excerpt || content.replace(/<[^>]*>/g, '').substring(0, 160) + '...';

    const result = await pool.query(
      `INSERT INTO posts (user_id, title, slug, content, excerpt, cover_image, tags, is_published, read_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [userId, title, slug, content, autoExcerpt, cover_image, tags || [], is_published !== false, read_time]
    );
    return result.rows[0];
  },

  // Update an existing post
  update: async (id, { title, content, excerpt, cover_image, tags, is_published }) => {
    const existing = await pool.query('SELECT * FROM posts WHERE id = $1', [id]);
    if (!existing.rows[0]) return null;

    const slug = title ? await generateSlug(title, id) : existing.rows[0].slug;
    const read_time = content ? calcReadTime(content) : existing.rows[0].read_time;

    const result = await pool.query(
      `UPDATE posts
       SET title        = COALESCE($1, title),
           slug         = $2,
           content      = COALESCE($3, content),
           excerpt      = COALESCE($4, excerpt),
           cover_image  = COALESCE($5, cover_image),
           tags         = COALESCE($6, tags),
           is_published = COALESCE($7, is_published),
           read_time    = $8
       WHERE id = $9
       RETURNING *`,
      [title, slug, content, excerpt, cover_image, tags, is_published, read_time, id]
    );
    return result.rows[0];
  },

  // Delete a post
  delete: async (id) => {
    await pool.query('DELETE FROM posts WHERE id = $1', [id]);
  },

  // Get owner of a post
  getOwnerId: async (id) => {
    const result = await pool.query('SELECT user_id FROM posts WHERE id = $1', [id]);
    return result.rows[0]?.user_id || null;
  },
};

module.exports = Post;