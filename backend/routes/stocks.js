const express = require('express');
const Parser  = require('rss-parser');
const { default: YF } = require('yahoo-finance2');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const yf  = new YF({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });
const rss = new Parser({ timeout: 6000, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; InvestRite/1.0)' } });

router.use(authenticateToken);

const SCACHE = new Map(); // search results
const DCACHE = new Map(); // stock detail
const CCACHE = new Map(); // chart by range

const RANGES = {
  '1d':  { interval: '5m',  days: 5,  lastDayOnly: true },
  '5d':  { interval: '30m', days: 8 },
  '1mo': { interval: '1d',  days: 31 },
  '6mo': { interval: '1d',  days: 186 },
  '1y':  { interval: '1d',  days: 366 },
  '5y':  { interval: '1wk', days: 365 * 5 },
  'max': { interval: '1mo', days: 365 * 32 },
};
const isIN = (s) => /\.(NS|BO)$/i.test(s || '');
function monthsAgoISO(m) { const d = new Date(); d.setMonth(d.getMonth() - m); return d.toISOString().split('T')[0]; }

// ── GET /api/stocks/search?q=  — autocomplete across US + India + global ─────
router.get('/search', async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  if (!q) return res.json({ results: [] });

  const key = q.toLowerCase();
  const hit = SCACHE.get(key);
  if (hit && Date.now() - hit.ts < 60 * 1000) return res.json({ results: hit.data });

  try {
    const r = await yf.search(q, { quotesCount: 9, newsCount: 0, enableFuzzyQuery: true });
    const results = (r.quotes || [])
      .filter(x => x.symbol && (x.isYahooFinance !== false))
      .filter(x => ['EQUITY', 'ETF', 'INDEX', 'MUTUALFUND', 'CRYPTOCURRENCY'].includes(x.quoteType) || x.quoteType == null)
      .map(x => ({
        symbol: x.symbol,
        name:   x.shortname || x.longname || x.symbol,
        exch:   x.exchDisp || x.exchange || '',
        type:   x.typeDisp || x.quoteType || '',
        market: isIN(x.symbol) ? 'IN' : 'US',
      }))
      .slice(0, 8);
    SCACHE.set(key, { data: results, ts: Date.now() });
    res.json({ results });
  } catch (e) {
    res.json({ results: [] });
  }
});

// ── GET /api/stocks/:ticker/chart?range=1d|5d|1mo|6mo|1y|5y|max ──────────────
router.get('/:ticker/chart', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const range = RANGES[req.query.range] ? req.query.range : '1y';
  const { interval, days } = RANGES[range];
  const ttl = (range === '1d' || range === '5d') ? 60 * 1000 : 5 * 60 * 1000;
  const key = `${ticker}:${range}`;
  const hit = CCACHE.get(key);
  if (hit && Date.now() - hit.ts < ttl) return res.json(hit.data);
  try {
    const period1 = new Date(Date.now() - days * 86400 * 1000);
    const r = await yf.chart(ticker, { period1, interval });
    let chart = (r.quotes || [])
      .filter(q => q.close != null && q.date)
      .map(q => ({ date: new Date(q.date).toISOString(), close: parseFloat(q.close.toFixed(2)) }));
    // For "1D", keep only the most recent trading session's intraday points.
    if (RANGES[range].lastDayOnly && chart.length) {
      const lastDay = chart[chart.length - 1].date.slice(0, 10);
      chart = chart.filter(p => p.date.slice(0, 10) === lastDay);
    }
    const data = { range, interval, chart };
    CCACHE.set(key, { data, ts: Date.now() });
    res.json(data);
  } catch (e) {
    res.status(502).json({ error: 'Chart unavailable', chart: [] });
  }
});

// ── GET /api/stocks/:ticker  — overview: quote stats + news ──────────────────
router.get('/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();
  const hit = DCACHE.get(ticker);
  if (hit && Date.now() - hit.ts < 60 * 1000) return res.json(hit.data);

  try {
    const quote = await yf.quote(ticker);
    if (!quote || !quote.symbol) return res.status(404).json({ error: `No data for ${ticker}` });

    const annualDiv = quote.trailingAnnualDividendRate ?? quote.dividendRate ?? null;
    const yld =
      quote.trailingAnnualDividendYield != null ? quote.trailingAnnualDividendYield * 100
      : quote.dividendYield != null ? (quote.dividendYield <= 1 ? quote.dividendYield * 100 : quote.dividendYield)
      : null;

    let news = [];
    try {
      const feed = await rss.parseURL(`https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(ticker)}&region=US&lang=en-US`);
      news = (feed.items || []).slice(0, 8).map(it => ({
        title: it.title?.trim(), link: it.link, source: 'Yahoo Finance',
        pubDate: it.pubDate || it.isoDate, summary: (it.contentSnippet || '').slice(0, 170),
      })).filter(a => a.title && a.link);
    } catch { /* news optional */ }

    const data = {
      ticker:    quote.symbol,
      name:      quote.longName || quote.shortName || quote.symbol,
      exchange:  quote.fullExchangeName || quote.exchange || '',
      currency:  quote.currency || (isIN(quote.symbol) ? 'INR' : 'USD'),
      market:    isIN(quote.symbol) ? 'IN' : 'US',
      price:     quote.regularMarketPrice ?? null,
      change:    quote.regularMarketChange ?? null,
      changePct: quote.regularMarketChangePercent ?? null,
      marketState: quote.marketState || null,
      stats: {
        open:          quote.regularMarketOpen ?? null,
        high:          quote.regularMarketDayHigh ?? null,
        low:           quote.regularMarketDayLow ?? null,
        marketCap:     quote.marketCap ?? null,
        peRatio:       quote.trailingPE ?? null,
        week52High:    quote.fiftyTwoWeekHigh ?? null,
        week52Low:     quote.fiftyTwoWeekLow ?? null,
        dividendYield: yld,
        qtrlyDiv:      annualDiv != null ? annualDiv / 4 : null,
        annualDiv,
        volume:        quote.regularMarketVolume ?? null,
        previousClose: quote.regularMarketPreviousClose ?? null,
      },
      news,
    };
    DCACHE.set(ticker, { data, ts: Date.now() });
    res.json(data);
  } catch (e) {
    console.error('[stocks]', ticker, e.message);
    res.status(502).json({ error: 'Stock data unavailable' });
  }
});

module.exports = router;
