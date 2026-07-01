const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { users } = require('./auth');

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req, res) => {
  const user = users.get(req.user.email);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ portfolio: user.portfolio || [] });
});

router.post('/positions', (req, res) => {
  const user = users.get(req.user.email);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { ticker, shares, avgCost, notes } = req.body;
  if (!ticker || !shares || !avgCost) {
    return res.status(400).json({ error: 'ticker, shares, and avgCost are required' });
  }

  const position = {
    id: Date.now().toString(),
    ticker: ticker.toUpperCase().trim(),
    shares: parseFloat(shares),
    avgCost: parseFloat(avgCost),
    notes: notes || '',
    addedAt: new Date().toISOString(),
  };

  user.portfolio.push(position);
  res.status(201).json({ position });
});

router.delete('/positions/:id', (req, res) => {
  const user = users.get(req.user.email);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const before = user.portfolio.length;
  user.portfolio = user.portfolio.filter((p) => p.id !== req.params.id);

  if (user.portfolio.length === before) {
    return res.status(404).json({ error: 'Position not found' });
  }
  res.json({ success: true });
});

// CSV import — expects array of parsed rows from frontend
router.post('/import', (req, res) => {
  const user = users.get(req.user.email);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'rows array is required' });
  }

  const imported = [];
  const errors = [];

  rows.forEach((row, i) => {
    const ticker = (row.ticker || row.symbol || row.TICKER || row.SYMBOL || '').toString().trim().toUpperCase();
    const shares = parseFloat(row.shares || row.quantity || row.SHARES || row.QTY || 0);
    const avgCost = parseFloat(row.avgCost || row.avg_cost || row.price || row.PRICE || row.COST || 0);

    if (!ticker || isNaN(shares) || isNaN(avgCost) || shares <= 0 || avgCost <= 0) {
      errors.push({ row: i + 1, reason: 'Missing or invalid ticker/shares/cost' });
      return;
    }

    const position = {
      id: `${Date.now()}-${i}`,
      ticker,
      shares,
      avgCost,
      notes: row.notes || '',
      addedAt: new Date().toISOString(),
    };
    user.portfolio.push(position);
    imported.push(position);
  });

  res.json({ imported: imported.length, errors });
});

module.exports = router;
