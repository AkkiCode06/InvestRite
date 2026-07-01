const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { getScreenedFlow, getTopCandidatePlan } = require('../services/screenerService');

const router = express.Router();

router.use(authenticateToken);

const DISCLAIMER =
  'Data sourced from Yahoo Finance via yahoo-finance2. For educational purposes only — not investment advice. Options trading involves significant risk of loss.';

const SCREEN_CRITERIA = {
  marketCapRange: '$1B–$10B',
  minPremiumPerOrder: '$30,000',
  minIVRank: '80% (approx. from realized volatility)',
  minBullishFlowPct: '70%',
  maxVolOI: '0.5',
  dteRange: '15–60 days',
};

// GET /api/screener/flow
router.get('/flow', async (req, res) => {
  try {
    const results = await getScreenedFlow();
    res.json({
      disclaimer: DISCLAIMER,
      count: results.length,
      screenCriteria: SCREEN_CRITERIA,
      results,
    });
  } catch (err) {
    console.error('Screener flow error:', err.message);
    res.status(500).json({ error: 'Failed to fetch screener data. Try again shortly.' });
  }
});

// GET /api/screener/trade-plan/:ticker
router.get('/trade-plan/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  try {
    const plan = await getTopCandidatePlan(ticker);
    if (!plan) {
      return res.status(404).json({ error: `No data available for ${ticker}` });
    }
    res.json({ disclaimer: DISCLAIMER, ...plan });
  } catch (err) {
    console.error(`Trade plan error for ${ticker}:`, err.message);
    res.status(500).json({ error: `Failed to fetch data for ${ticker}. Try again shortly.` });
  }
});

module.exports = router;
