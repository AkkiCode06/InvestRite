const express = require('express');
const { default: YF } = require('yahoo-finance2');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const yf = new YF({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });
router.use(authenticateToken);

// Simple cache — 5 minutes
const CACHE = new Map();
const TTL = 5 * 60 * 1000;

async function getQuoteEnriched(ticker) {
  const k = `phq:${ticker}`;
  const hit = CACHE.get(k);
  if (hit && Date.now() - hit.ts < TTL) return hit.data;

  try {
    const [quote, summary] = await Promise.all([
      yf.quote(ticker),
      yf.quoteSummary(ticker, { modules: ['summaryProfile', 'defaultKeyStatistics'] }).catch(() => null),
    ]);

    const data = {
      ticker,
      name:        quote.longName || quote.shortName || ticker,
      price:       quote.regularMarketPrice || 0,
      sector:      summary?.summaryProfile?.sector || quote.sector || 'Unknown',
      industry:    summary?.summaryProfile?.industry || '',
      // yahoo-finance2 v3 returns plain numbers, not { raw, fmt } objects
      beta: (v => v != null ? (typeof v === 'object' ? (v.raw ?? null) : v) : null)(summary?.defaultKeyStatistics?.beta),
      week52High:  quote.fiftyTwoWeekHigh || null,
      week52Low:   quote.fiftyTwoWeekLow  || null,
      marketCap:   quote.marketCap || 0,
      changePercent: quote.regularMarketChangePercent || 0,
    };

    CACHE.set(k, { data, ts: Date.now() });
    return data;
  } catch {
    return { ticker, name: ticker, price: 0, sector: 'Unknown', industry: '', beta: null, week52High: null, week52Low: null, marketCap: 0, changePercent: 0 };
  }
}

// GET /api/portfolio/health?tickers=NVTS,AAPL,...
router.get('/health', async (req, res) => {
  const rawTickers = (req.query.tickers || '').toUpperCase().split(',').map(t => t.trim()).filter(Boolean);
  if (!rawTickers.length) return res.json({ enriched: [] });

  // Fetch in parallel (max 10 at once)
  const chunks = [];
  for (let i = 0; i < rawTickers.length; i += 10) chunks.push(rawTickers.slice(i, i + 10));

  const enriched = [];
  for (const chunk of chunks) {
    const results = await Promise.allSettled(chunk.map(getQuoteEnriched));
    for (const r of results) if (r.status === 'fulfilled') enriched.push(r.value);
  }

  res.json({ enriched });
});

// ── Lean batch quotes for alert polling ────────────────────────────────────
// Only the fields the alert engine needs — no quoteSummary, so it's fast and
// cheap to poll on an interval. Short 25s cache to coalesce multiple tabs.
const QCACHE = new Map();
const QTTL = 25 * 1000;

// GET /api/portfolio/quotes?tickers=AAPL,F,QQQ
router.get('/quotes', async (req, res) => {
  const tickers = (req.query.tickers || '').toUpperCase().split(',').map(t => t.trim()).filter(Boolean);
  if (!tickers.length) return res.json({ quotes: [] });

  const unique = [...new Set(tickers)].slice(0, 60);
  const key = unique.slice().sort().join(',');
  const hit = QCACHE.get(key);
  if (hit && Date.now() - hit.ts < QTTL) return res.json({ quotes: hit.data });

  try {
    const raw = await yf.quote(unique);
    const arr = Array.isArray(raw) ? raw : [raw];
    const quotes = arr.filter(Boolean).map(q => ({
      ticker:        q.symbol,
      name:          q.longName || q.shortName || q.symbol,
      price:         q.regularMarketPrice ?? null,
      dayHigh:       q.regularMarketDayHigh ?? null,
      dayLow:        q.regularMarketDayLow ?? null,
      week52High:    q.fiftyTwoWeekHigh ?? null,
      week52Low:     q.fiftyTwoWeekLow ?? null,
      previousClose: q.regularMarketPreviousClose ?? null,
      open:          q.regularMarketOpen ?? null,
      changePercent: q.regularMarketChangePercent ?? null,
      marketState:   q.marketState || null,
    }));
    QCACHE.set(key, { data: quotes, ts: Date.now() });
    res.json({ quotes });
  } catch (e) {
    res.status(502).json({ error: 'quote fetch failed', quotes: [] });
  }
});

module.exports = router;
