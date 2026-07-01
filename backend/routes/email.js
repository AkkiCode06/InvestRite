const express = require('express');
const crypto  = require('crypto');
const { authenticateToken } = require('../middleware/auth');
const { sendWelcome, sendLoginAlert, sendPasswordResetCode, sendEmailChangeCode, sendPriceAlert } = require('../services/emailService');

const router = express.Router();

// In-memory code store (TTL: 15 min, max 5 attempts)
const CODES = new Map();
function generateCode() {
  // crypto.randomInt is CSPRNG — safer than Math.random
  const crypto = require('crypto');
  return String(crypto.randomInt(100000, 999999));
}
function storeCode(email, purpose, code) {
  CODES.set(`${purpose}:${email}`, { code, expires: Date.now() + 15 * 60 * 1000, attempts: 0 });
}
function verifyCode(email, purpose, code) {
  const key   = `${purpose}:${email}`;
  const entry = CODES.get(key);
  if (!entry) return false;
  if (Date.now() > entry.expires) { CODES.delete(key); return false; }
  entry.attempts++;
  if (entry.attempts > 5) { CODES.delete(key); return false; } // lock after 5 wrong tries
  if (entry.code !== String(code)) return false;
  CODES.delete(key);
  return true;
}

// ── POST /api/email/welcome  (internal — requires Firebase auth) ─────────────
// Moved behind authenticateToken so random actors can't spam welcome emails
router.post('/welcome', authenticateToken, async (req, res) => {
  // Only send to the authenticated user's own email — prevents email spoofing
  const email = req.user.email;
  const name  = req.user.name || email;
  const sent  = await sendWelcome({ to: email, name }).catch(() => false);
  res.json({ sent });
});

// ── POST /api/email/login-alert  (called after successful login) ─────────────
router.post('/login-alert', authenticateToken, async (req, res) => {
  const { userAgent, ip } = req.body;
  const email = req.user.email;
  const name  = req.user.name  || email;
  const time  = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });
  const sent  = await sendLoginAlert({ to: email, name, time, userAgent, ip }).catch(() => false);
  res.json({ sent });
});

// ── POST /api/email/alert  (authenticated — price-alert notification) ───────
// Only ever sends to the authenticated user's own email (no spoofing).
router.post('/alert', authenticateToken, async (req, res) => {
  const { ticker, title, message, action, price, sentiment } = req.body || {};
  if (!ticker || !message) return res.status(400).json({ error: 'ticker and message required' });
  const email = req.user.email;
  const name  = req.user.name || email;
  const sent  = await sendPriceAlert({ to: email, name, ticker, title, message, action, price, sentiment }).catch(() => false);
  res.json({ sent });
});

// ── POST /api/email/request-password-reset  (unauthenticated) ───────────────
router.post('/request-password-reset', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });
  const code = generateCode();
  storeCode(email, 'password-reset', code);
  // Best effort — don't reveal if email exists
  const name = email.split('@')[0];
  await sendPasswordResetCode({ to: email, name, code }).catch(() => {});
  res.json({ sent: true, message: 'If an account exists with that email, a code was sent.' });
});

// ── POST /api/email/verify-reset-code ───────────────────────────────────────
router.post('/verify-reset-code', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'email and code required' });
  const valid = verifyCode(email, 'password-reset', code);
  if (!valid) return res.status(400).json({ error: 'Invalid or expired code' });
  res.json({ valid: true });
});

// ── POST /api/email/request-email-change  (authenticated) ───────────────────
router.post('/request-email-change', authenticateToken, async (req, res) => {
  const { newEmail } = req.body;
  if (!newEmail) return res.status(400).json({ error: 'newEmail required' });
  const code = generateCode();
  storeCode(newEmail, 'email-change', code);
  const name = req.user.name || req.user.email;
  await sendEmailChangeCode({ to: newEmail, name, code, newEmail }).catch(() => {});
  res.json({ sent: true });
});

// ── POST /api/email/verify-email-change ─────────────────────────────────────
router.post('/verify-email-change', authenticateToken, (req, res) => {
  const { newEmail, code } = req.body;
  if (!newEmail || !code) return res.status(400).json({ error: 'newEmail and code required' });
  const valid = verifyCode(newEmail, 'email-change', code);
  if (!valid) return res.status(400).json({ error: 'Invalid or expired code' });
  res.json({ valid: true });
});

module.exports = router;
