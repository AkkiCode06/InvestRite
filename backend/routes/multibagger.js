const express = require('express');
const { default: YF } = require('yahoo-finance2');
const { authenticateToken } = require('../middleware/auth');
const { runMultiBaggerScreen } = require('../services/multibaggerService');

const router = express.Router();
const yf = new YF({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });
router.use(authenticateToken);

const DISCLAIMER =
  'Data sourced from Yahoo Finance. For educational purposes only — not investment advice. Past performance does not guarantee future results.';

// Chart cache (5 min TTL per ticker)
const CHART_CACHE = new Map();
const CHART_TTL = 5 * 60 * 1000;

// GET /api/multibagger/screen?mode=5x|10x|income
router.get('/screen', async (req, res) => {
  const mode = ['5x', '10x', 'income'].includes(req.query.mode) ? req.query.mode : '5x';
  const region = req.query.region === 'IN' ? 'IN' : 'US';
  try {
    const results = await runMultiBaggerScreen(mode, region);
    res.json({ disclaimer: DISCLAIMER, mode, region, count: results.length, results });
  } catch (err) {
    console.error('[multibagger] screen error:', err.message);
    res.status(500).json({ error: 'Screen failed — try again shortly.' });
  }
});

// GET /api/multibagger/chart/:ticker  — 6-month daily OHLCV
router.get('/chart/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();

  const hit = CHART_CACHE.get(ticker);
  if (hit && Date.now() - hit.ts < CHART_TTL) return res.json(hit.data);

  try {
    const period1 = new Date();
    period1.setMonth(period1.getMonth() - 6);

    const result = await yf.chart(ticker, {
      period1: period1.toISOString().split('T')[0],
      interval: '1d',
    });

    const prices = (result.quotes || [])
      .filter((q) => q.close && q.date)
      .map((q) => ({
        date: new Date(q.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        close: parseFloat(q.close.toFixed(2)),
        volume: q.volume || 0,
      }));

    const first = prices[0]?.close ?? 0;
    const last  = prices[prices.length - 1]?.close ?? 0;
    const changePct = first > 0 ? parseFloat(((last - first) / first * 100).toFixed(1)) : 0;

    const payload = { ticker, prices, changePct, first, last };
    CHART_CACHE.set(ticker, { data: payload, ts: Date.now() });
    res.json(payload);
  } catch (err) {
    console.error(`[chart] ${ticker}: ${err.message}`);
    res.status(500).json({ error: 'Chart data unavailable.' });
  }
});

module.exports = router;
