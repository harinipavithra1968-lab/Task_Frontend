const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/error');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const respond = (user) => ({ token: sign(user._id), user: { id: user._id, username: user.username, email: user.email } });

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  const user = await User.create({ username, email, password });
  res.status(201).json(respond(user));
});

// POST /api/auth/login  (identifier = email or username)
exports.login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    res.status(400);
    throw new Error('Email/username and password are required');
  }
  const id = String(identifier).trim().toLowerCase();
  const user = await User.findOne({ $or: [{ email: id }, { username: id }] });
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid credentials');
  }
  res.json(respond(user));
});
