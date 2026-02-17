const Post = require('../models/Post');

const postController = {
  // GET /api/posts
  getFeed: async (req, res) => {
    const { page = 1, limit = 12, feed = 'all', tag, search } = req.query;

    const { posts, total } = await Post.findAll({
      page: parseInt(page),
      limit: parseInt(limit),
      feed,
      userId: req.user?.id || null,
      tag,
      search,
    });

    res.json({
      posts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  },

  // GET /api/posts/:slug
  getPost: async (req, res) => {
    const post = await Post.findBySlug(req.params.slug, req.user?.id || null);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const Comment = require('../models/Comment');
    const comments = await Comment.findByPost(post.id);

    res.json({ post, comments });
  },

  // POST /api/posts
  createPost: async (req, res) => {
    const { title, content, excerpt, cover_image, tags, is_published } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required.' });
    }

    const post = await Post.create({
      userId: req.user.id,
      title: title.trim(),
      content,
      excerpt: excerpt?.trim(),
      cover_image: cover_image?.trim(),
      tags: tags || [],
      is_published,
    });

    res.status(201).json({ post });
  },

  // PUT /api/posts/:id
  updatePost: async (req, res) => {
    const ownerId = await Post.getOwnerId(req.params.id);
    if (!ownerId) return res.status(404).json({ error: 'Post not found.' });
    if (ownerId !== req.user.id) return res.status(403).json({ error: 'Not authorized.' });

    const { title, content, excerpt, cover_image, tags, is_published } = req.body;

    const post = await Post.update(req.params.id, {
      title, content, excerpt, cover_image, tags, is_published,
    });

    res.json({ post });
  },

  // DELETE /api/posts/:id
  deletePost: async (req, res) => {
    const ownerId = await Post.getOwnerId(req.params.id);
    if (!ownerId) return res.status(404).json({ error: 'Post not found.' });
    if (ownerId !== req.user.id) return res.status(403).json({ error: 'Not authorized.' });

    await Post.delete(req.params.id);
    res.json({ message: 'Post deleted successfully.' });
  },
};

module.exports = postController;