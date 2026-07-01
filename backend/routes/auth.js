const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// In-memory user store (no database for free dev setup)
const users = new Map();

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const emailLower = email.toLowerCase();
  if (users.has(emailLower)) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const userId = uuidv4();
  const sessionSeed = Math.floor(Math.random() * 1000000000);

  users.set(emailLower, {
    id: userId,
    name,
    email: emailLower,
    passwordHash,
    sessionSeed,
    portfolio: [],
    createdAt: new Date().toISOString(),
  });

  const token = jwt.sign(
    { userId, email: emailLower, name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    token,
    user: { id: userId, name, email: emailLower },
    sessionSeed,
  });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const emailLower = email.toLowerCase();
  const user = users.get(emailLower);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { userId: user.id, email: emailLower, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: emailLower },
    sessionSeed: user.sessionSeed,
  });
});

router.get('/me', require('../middleware/auth').authenticateToken, (req, res) => {
  const user = users.get(req.user.email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({
    user: { id: user.id, name: user.name, email: user.email },
    sessionSeed: user.sessionSeed,
  });
});

module.exports = { router, users };
