const User = require('../models/User');
const Post = require('../models/Post');
const Follow = require('../models/Follow');

const userController = {
  // GET /api/users
  searchUsers: async (req, res) => {
    const users = await User.search(req.query.search || '');
    res.json({ users });
  },

  // GET /api/users/:username
  getProfile: async (req, res) => {
    const profile = await User.findByUsername(req.params.username);
    if (!profile) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Check if the logged-in user follows this profile
    let is_following = false;
    if (req.user && req.user.id !== profile.id) {
      is_following = await Follow.exists(req.user.id, profile.id);
    }

    res.json({ user: { ...profile, is_following } });
  },

  // GET /api/users/:username/posts
  getUserPosts: async (req, res) => {
    const profile = await User.findByUsername(req.params.username);
    if (!profile) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { page = 1, limit = 12 } = req.query;
    const { posts, total } = await Post.findByUserId({
      userId: profile.id,
      page: parseInt(page),
      limit: parseInt(limit),
      currentUserId: req.user?.id || null,
    });

    res.json({
      posts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  },

  // POST /api/users/:username/follow  — toggles follow on/off
  toggleFollow: async (req, res) => {
    const target = await User.findByUsername(req.params.username);
    if (!target) return res.status(404).json({ error: 'User not found.' });
    if (target.id === req.user.id) return res.status(400).json({ error: 'You cannot follow yourself.' });

    const alreadyFollowing = await Follow.exists(req.user.id, target.id);

    if (alreadyFollowing) {
      await Follow.delete(req.user.id, target.id);
    } else {
      await Follow.create(req.user.id, target.id);
    }

    const followers_count = await Follow.countFollowers(target.id);
    res.json({ following: !alreadyFollowing, followers_count });
  },

  // GET /api/users/:username/followers
  getFollowers: async (req, res) => {
    const profile = await User.findByUsername(req.params.username);
    if (!profile) return res.status(404).json({ error: 'User not found.' });

    const users = await Follow.getFollowers(profile.id);
    res.json({ users });
  },

  // GET /api/users/:username/following
  getFollowing: async (req, res) => {
    const profile = await User.findByUsername(req.params.username);
    if (!profile) return res.status(404).json({ error: 'User not found.' });

    const users = await Follow.getFollowing(profile.id);
    res.json({ users });
  },
};

module.exports = userController;