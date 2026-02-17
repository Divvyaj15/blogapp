const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const authController = {
  // POST /api/auth/register
  register: async (req, res) => {
    const { username, email, password, full_name } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (username.length < 3 || !/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Username must be 3+ characters: letters, numbers, underscores only.' });
    }

    const exists = await User.existsByEmailOrUsername(email, username);
    if (exists) {
      return res.status(409).json({ error: 'Email or username already taken.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const avatar_url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;

    const user = await User.create({ username, email, password_hash, full_name: full_name || username, avatar_url });
    const token = signToken(user);

    res.status(201).json({ token, user });
  },

  // POST /api/auth/login
  login: async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const { password_hash, ...userWithoutPassword } = user;
    const token = signToken(user);

    res.json({ token, user: userWithoutPassword });
  },

  // GET /api/auth/me
  getMe: async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user });
  },

  // PUT /api/auth/profile
  updateProfile: async (req, res) => {
    const { full_name, bio, website, avatar_url } = req.body;
    const user = await User.update(req.user.id, { full_name, bio, website, avatar_url });
    res.json({ user });
  },
};

module.exports = authController;