require('dotenv').config();
const express   = require('express');
const Parser    = require('rss-parser');
const { default: YF } = require('yahoo-finance2');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

const yf     = new YF({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });
const rssParser = new Parser({
  timeout: 6000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; InvestRite/1.0)' },
  customFields: { item: ['media:content', 'media:thumbnail'] },
});

// ── Cache ─────────────────────────────────────────────────────────────────
const CACHE = new Map();
function cached(key, fn, ttlMs) {
  const hit = CACHE.get(key);
  if (hit && Date.now() - hit.ts < ttlMs) return Promise.resolve(hit.data);
  return fn().then(d => { CACHE.set(key, { data: d, ts: Date.now() }); return d; });
}

// ── Market watchlist for ticker tape (gainers/losers) ─────────────────────
const WATCHLIST = [
  'AAPL','MSFT','NVDA','GOOGL','META','AMZN','TSLA','NFLX',
  'AMD','ORCL','SNOW','CRM','COIN','MSTR','PLTR','SOFI',
  'RBLX','UBER','ABNB','DASH','SNAP','PYPL','AFRM','HOOD',
  'RIVN','NIO','BIDU','BABA','CELH','HIMS','NVTS','DKNG',
];

const INDEX_TICKERS = [
  { sym: 'SPY',      label: 'S&P 500' },
  { sym: 'QQQ',      label: 'NASDAQ' },
  { sym: 'DIA',      label: 'Dow Jones' },
  { sym: '^VIX',     label: 'VIX' },
  { sym: 'BTC-USD',  label: 'Bitcoin' },
  { sym: 'GC=F',     label: 'Gold' },
  { sym: 'EURUSD=X', label: 'EUR/USD' },
  { sym: '^TNX',     label: '10Y Yield' },
];

const NEWS_SOURCES = [
  { url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=AAPL,TSLA,NVDA,MSFT,AMZN&region=US&lang=en-US', source: 'Yahoo Finance' },
  { url: 'https://www.cnbc.com/id/20910258/device/rss/rss.html',     source: 'CNBC Markets' },
  { url: 'https://feeds.marketwatch.com/marketwatch/topstories/',     source: 'MarketWatch' },
  { url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',    source: 'CNBC' },
  { url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=SPY,QQQ,GLD,TLT&region=US&lang=en-US', source: 'Yahoo Markets' },
];

// ── India (NSE/BSE) universes ─────────────────────────────────────────────
const IN_WATCHLIST = [
  'RELIANCE.NS','TCS.NS','HDFCBANK.NS','INFY.NS','ICICIBANK.NS','SBIN.NS','BHARTIARTL.NS','ITC.NS',
  'LT.NS','AXISBANK.NS','KOTAKBANK.NS','HINDUNILVR.NS','BAJFINANCE.NS','MARUTI.NS','SUNPHARMA.NS','TATAMOTORS.NS',
  'WIPRO.NS','ADANIENT.NS','TATASTEEL.NS','ONGC.NS','NTPC.NS','POWERGRID.NS','COALINDIA.NS','HCLTECH.NS',
  'ASIANPAINT.NS','TITAN.NS','ULTRACEMCO.NS','JSWSTEEL.NS','ADANIPORTS.NS','BAJAJFINSV.NS','ZOMATO.NS','DLF.NS',
];

const IN_INDEX_TICKERS = [
  { sym: '^NSEI',     label: 'Nifty 50' },
  { sym: '^BSESN',    label: 'Sensex' },
  { sym: '^NSEBANK',  label: 'Bank Nifty' },
  { sym: '^CNXIT',    label: 'Nifty IT' },
  { sym: '^INDIAVIX', label: 'India VIX' },
  { sym: 'INR=X',     label: 'USD/INR' },
  { sym: 'GC=F',      label: 'Gold' },
  { sym: 'BTC-USD',   label: 'Bitcoin' },
];

const IN_NEWS_SOURCES = [
  { url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms', source: 'ET Markets' },
  { url: 'https://www.livemint.com/rss/markets',                                 source: 'Mint Markets' },
  { url: 'https://www.moneycontrol.com/rss/MCtopnews.xml',                       source: 'Moneycontrol' },
  { url: 'https://www.business-standard.com/rss/markets-106.rss',               source: 'Business Standard' },
  { url: 'https://www.thehindubusinessline.com/markets/feeder/default.rss',     source: 'BusinessLine' },
];

function pickMarket(region) {
  return region === 'IN'
    ? { watchlist: IN_WATCHLIST, indexTickers: IN_INDEX_TICKERS, news: IN_NEWS_SOURCES }
    : { watchlist: WATCHLIST,    indexTickers: INDEX_TICKERS,    news: NEWS_SOURCES };
}

// ── GET /api/dashboard/market?region=US|IN ─────────────────────────────────
router.get('/market', async (req, res) => {
  const region = req.query.region === 'IN' ? 'IN' : 'US';
  const { watchlist, indexTickers } = pickMarket(region);
  try {
    const data = await cached(`dashboard:market:${region}`, async () => {
      // Fetch all watchlist + index quotes in parallel batches
      const allTickers = [...watchlist, ...indexTickers.map(i => i.sym)];
      const results = [];
      for (let i = 0; i < allTickers.length; i += 8) {
        const batch = allTickers.slice(i, i + 8);
        const settled = await Promise.allSettled(batch.map(t => yf.quote(t)));
        for (const r of settled) if (r.status === 'fulfilled' && r.value) results.push(r.value);
        if (i + 8 < allTickers.length) await new Promise(r => setTimeout(r, 200));
      }

      const quoteMap = Object.fromEntries(results.map(q => [q.symbol, q]));

      // Gainers / losers from watchlist
      const watchlistQuotes = watchlist
        .map(s => quoteMap[s])
        .filter(q => q && q.regularMarketChangePercent != null)
        .map(q => ({
          symbol:  q.symbol,
          name:    q.shortName || q.longName || q.symbol,
          price:   q.regularMarketPrice,
          change:  parseFloat((q.regularMarketChange || 0).toFixed(2)),
          changePct: parseFloat((q.regularMarketChangePercent || 0).toFixed(2)),
        }));

      const gainers = [...watchlistQuotes].sort((a, b) => b.changePct - a.changePct).slice(0, 12);
      const losers  = [...watchlistQuotes].sort((a, b) => a.changePct - b.changePct).slice(0, 12);

      // Indices
      const indices = indexTickers.map(({ sym, label }) => {
        const q = quoteMap[sym];
        if (!q) return null;
        return {
          symbol: sym, label,
          price:     q.regularMarketPrice,
          change:    parseFloat((q.regularMarketChange || 0).toFixed(2)),
          changePct: parseFloat((q.regularMarketChangePercent || 0).toFixed(2)),
          currency:  q.currency,
        };
      }).filter(Boolean);

      return { region, gainers, losers, indices, updatedAt: new Date().toISOString() };
    }, 3 * 60 * 1000); // 3 min cache

    res.json(data);
  } catch (err) {
    console.error('[dashboard/market]', err.message);
    res.status(500).json({ error: 'Market data unavailable' });
  }
});

// ── GET /api/dashboard/news ───────────────────────────────────────────────
router.get('/news', async (req, res) => {
  const region = req.query.region === 'IN' ? 'IN' : 'US';
  const { news } = pickMarket(region);
  try {
    const articles = await cached(`dashboard:news:${region}`, async () => {
      const results = await Promise.allSettled(
        news.map(async ({ url, source }) => {
          const feed = await rssParser.parseURL(url).catch(() => null);
          if (!feed) return [];
          return (feed.items || []).slice(0, 8).map(item => ({
            title:     item.title?.trim(),
            link:      item.link,
            pubDate:   item.pubDate || item.isoDate,
            source,
            summary:   item.contentSnippet?.slice(0, 180) || '',
          })).filter(a => a.title && a.link);
        })
      );

      const all = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
      // Deduplicate by title, sort by pubDate desc
      const seen = new Set();
      return all
        .filter(a => { if (seen.has(a.title)) return false; seen.add(a.title); return true; })
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, 30);
    }, 10 * 60 * 1000); // 10 min cache

    res.json({ articles, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[dashboard/news]', err.message);
    res.status(500).json({ error: 'News unavailable', articles: [] });
  }
});

module.exports = router;
