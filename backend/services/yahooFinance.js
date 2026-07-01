const { default: YF } = require('yahoo-finance2');
const yf = new YF({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

// Suppress verbose schema validation console output in dev
const _console = { warn: console.warn };
console.warn = (...args) => {
  const msg = String(args[0] || '');
  if (msg.includes('did not validate') || msg.includes('OptionsResult')) return;
  _console.warn(...args);
};

// ── Simple in-memory cache (5-minute TTL) ────────────────────────────────────
const CACHE = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function cached(key, fn) {
  const hit = CACHE.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return Promise.resolve(hit.data);
  return fn().then((data) => {
    CACHE.set(key, { data, ts: Date.now() });
    return data;
  });
}

// ── Quote ────────────────────────────────────────────────────────────────────

async function getQuote(ticker) {
  return cached(`quote:${ticker}`, () => yf.quote(ticker));
}

// ── Historical OHLCV via chart() ─────────────────────────────────────────────

async function getHistorical(ticker) {
  const period1 = new Date();
  period1.setFullYear(period1.getFullYear() - 1);
  return cached(`hist:${ticker}`, () =>
    yf.chart(ticker, {
      period1: period1.toISOString().split('T')[0],
      interval: '1d',
    }).then((r) => {
      // chart() returns { quotes: [...], meta: {...} }
      return (r.quotes || []).filter(
        (b) => b.open && b.high && b.low && b.close && b.volume
      );
    })
  );
}

// ── Options chain (all DTE 15–60 expiries) ───────────────────────────────────

async function getOptionsInRange(ticker) {
  return cached(`options:${ticker}`, async () => {
    // First call: get the list of all expiration dates
    const base = await yf.options(ticker);
    const allExpiries = base.expirationDates || []; // array of Date objects or timestamps

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter to DTE 15–60
    const validExpiries = allExpiries.filter((exp) => {
      const expDate = exp instanceof Date ? exp : new Date(exp * 1000);
      const dte = Math.round((expDate - today) / (1000 * 60 * 60 * 24));
      return dte >= 15 && dte <= 60;
    });

    if (validExpiries.length === 0) {
      // Return the base chain anyway (nearest expiry) for partial data
      return base.options || [];
    }

    // Fetch each valid expiry (concurrently, max 3 at a time)
    const chains = [];
    for (let i = 0; i < validExpiries.length; i += 3) {
      const batch = validExpiries.slice(i, i + 3);
      const results = await Promise.allSettled(
        batch.map((exp) => {
          const expDate = exp instanceof Date ? exp : new Date(exp * 1000);
          // yahoo-finance2 v3 options() accepts { date: Date }
          return yf.options(ticker, { date: expDate });
        })
      );
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value?.options?.[0]) {
          chains.push(...r.value.options);
        }
      }
    }
    return chains;
  });
}

// ── Earnings date ────────────────────────────────────────────────────────────

async function getEarningsDate(ticker) {
  try {
    const summary = await cached(`earnings:${ticker}`, () =>
      yf.quoteSummary(ticker, { modules: ['calendarEvents'] })
    );
    const dates = summary?.calendarEvents?.earnings?.earningsDate;
    if (!dates || dates.length === 0) return null;
    const d = dates[0] instanceof Date ? dates[0] : new Date(dates[0]);
    return d.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

// ── IV Rank (realized vol percentile over 1 year) ────────────────────────────

function calcIVRank(bars) {
  if (!bars || bars.length < 30) return 50;

  function rv30(slice) {
    const returns = [];
    for (let i = 1; i < slice.length; i++) {
      if (slice[i].close && slice[i - 1].close)
        returns.push(Math.log(slice[i].close / slice[i - 1].close));
    }
    if (returns.length < 2) return 0;
    const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
    const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;
    return Math.sqrt(variance * 252) * 100;
  }

  const samples = [];
  for (let i = 30; i <= bars.length; i += 5) {
    const v = rv30(bars.slice(i - 30, i));
    if (v > 0) samples.push(v);
  }
  if (samples.length === 0) return 50;

  const current = rv30(bars.slice(-30));
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  if (max === min) return 50;

  return Math.min(99, Math.max(1, Math.round(((current - min) / (max - min)) * 100)));
}

// ── Support / Resistance ─────────────────────────────────────────────────────

function calcLevels(bars, currentPrice) {
  if (!bars || bars.length < 20 || !currentPrice) {
    return {
      supports: [parseFloat((currentPrice * 0.93).toFixed(2)), parseFloat((currentPrice * 0.86).toFixed(2))],
      resistances: [parseFloat((currentPrice * 1.07).toFixed(2)), parseFloat((currentPrice * 1.15).toFixed(2))],
    };
  }

  const recent = bars.slice(-60);
  const pivotHighs = [];
  const pivotLows = [];

  for (let i = 5; i < recent.length - 5; i++) {
    const window = recent.slice(i - 5, i + 6);
    const maxH = Math.max(...window.map((b) => b.high || 0));
    const minL = Math.min(...window.map((b) => b.low || Infinity));
    if (recent[i].high === maxH) pivotHighs.push(recent[i].high);
    if (recent[i].low === minL) pivotLows.push(recent[i].low);
  }

  let supports = [...new Set(pivotLows.map((v) => parseFloat(v.toFixed(2))))]
    .filter((v) => v < currentPrice && v > 0)
    .sort((a, b) => b - a)
    .slice(0, 2);

  let resistances = [...new Set(pivotHighs.map((v) => parseFloat(v.toFixed(2))))]
    .filter((v) => v > currentPrice)
    .sort((a, b) => a - b)
    .slice(0, 2);

  // Fallback padding
  while (supports.length < 2)
    supports.push(parseFloat((currentPrice * (0.93 - supports.length * 0.07)).toFixed(2)));
  while (resistances.length < 2)
    resistances.push(parseFloat((currentPrice * (1.07 + resistances.length * 0.08)).toFixed(2)));

  return { supports, resistances };
}

// ── RSI ──────────────────────────────────────────────────────────────────────

function calcRSI(bars, period = 14) {
  if (!bars || bars.length < period + 1) return 50;
  const closes = bars.map((b) => b.close).filter(Boolean);
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  const rs = gains / (losses || 0.0001);
  return parseFloat((100 - 100 / (1 + rs)).toFixed(1));
}

// ── Aggregate options flow ───────────────────────────────────────────────────

function aggregateFlow(chains, currentPrice) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let bullishPremium = 0, bearishPremium = 0;
  let totalVolume = 0, totalOI = 0;
  let largestOrder = 0;
  let atmIV = 0, atmDist = Infinity;
  let representativeDTE = 30;

  for (const expiry of chains) {
    // expirationDate may be Date obj or ISO string
    const expDate = expiry.expirationDate instanceof Date
      ? expiry.expirationDate
      : new Date(expiry.expirationDate);
    const dte = Math.round((expDate - today) / (1000 * 60 * 60 * 24));

    if (dte >= 15 && dte <= 60) representativeDTE = dte;

    const processContracts = (contracts, isBullish) => {
      for (const c of contracts || []) {
        const vol = c.volume || 0;
        const oi = c.openInterest || 0;
        const bid = c.bid || 0;
        const ask = c.ask || 0;
        if (vol === 0 && oi === 0) continue;

        const midpoint = bid > 0 && ask > 0 ? (bid + ask) / 2 : c.lastPrice || 0;
        const premium = midpoint * vol * 100;

        if (isBullish) bullishPremium += premium;
        else bearishPremium += premium;

        totalVolume += vol;
        totalOI += oi;
        if (premium > largestOrder) largestOrder = premium;

        const strike = c.strike || 0;
        const dist = Math.abs(strike - currentPrice);
        if (dist < atmDist && c.impliedVolatility > 0) {
          atmDist = dist;
          atmIV = c.impliedVolatility * 100;
        }
      }
    };

    processContracts(expiry.calls, true);
    processContracts(expiry.puts, false);
  }

  const totalPremium = bullishPremium + bearishPremium;
  const bullishFlowPct = totalPremium > 0
    ? parseFloat(((bullishPremium / totalPremium) * 100).toFixed(1))
    : 50;
  const volOI = totalOI > 0 ? parseFloat((totalVolume / totalOI).toFixed(2)) : 0;

  return {
    bullishPremium: Math.round(bullishPremium),
    bearishPremium: Math.round(bearishPremium),
    totalPremium: Math.round(totalPremium),
    bullishFlowPct,
    bearishFlowPct: parseFloat((100 - bullishFlowPct).toFixed(1)),
    totalVolume,
    totalOI,
    volOI,
    largestOrder: Math.round(largestOrder),
    atmIV: parseFloat((atmIV || 0).toFixed(1)),
    representativeDTE,
  };
}

// ── Build full ticker profile ────────────────────────────────────────────────

async function buildTickerProfile(ticker) {
  try {
    const [quoteResult, chainsResult, histResult, earningsResult] = await Promise.allSettled([
      getQuote(ticker),
      getOptionsInRange(ticker),
      getHistorical(ticker),
      getEarningsDate(ticker),
    ]);

    const q = quoteResult.status === 'fulfilled' ? quoteResult.value : null;
    if (!q?.regularMarketPrice) return null;

    const chains = chainsResult.status === 'fulfilled' ? chainsResult.value : [];
    const hist = histResult.status === 'fulfilled' ? histResult.value : [];
    const earningsDate = earningsResult.status === 'fulfilled' ? earningsResult.value : null;

    const currentPrice = q.regularMarketPrice;
    const marketCapB = q.marketCap ? parseFloat((q.marketCap / 1e9).toFixed(2)) : 0;

    const flow = aggregateFlow(chains, currentPrice);
    const ivRank = calcIVRank(hist);
    const { supports, resistances } = calcLevels(hist, currentPrice);
    const rsi = calcRSI(hist);

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const hasNearCatalyst = earningsDate
      ? (new Date(earningsDate) - today) >= 0 && (new Date(earningsDate) - today) <= sevenDaysMs
      : false;

    const avgVolume = q.averageDailyVolume10Day || q.averageDailyVolume3Month || 0;

    return {
      ticker,
      name: q.longName || q.shortName || ticker,
      currentPrice: parseFloat(currentPrice.toFixed(2)),
      marketCap: marketCapB,
      bullishPremium: flow.bullishPremium,
      bearishPremium: flow.bearishPremium,
      totalPremium: flow.totalPremium,
      bullishFlowPct: flow.bullishFlowPct,
      bearishFlowPct: flow.bearishFlowPct,
      ivRank,
      volOI: flow.volOI,
      largestOrder: flow.largestOrder,
      dte: flow.representativeDTE,
      earningsDate,
      fdaDate: null,
      hasNearCatalyst,
      catalystNote: hasNearCatalyst && earningsDate ? `Earnings: ${earningsDate}` : null,
      technicals: {
        currentPrice: parseFloat(currentPrice.toFixed(2)),
        trend: rsi > 55 ? 'Uptrend' : rsi < 45 ? 'Downtrend' : 'Sideways',
        support: supports,
        resistance: resistances,
        rsi,
        macdSignal: rsi > 55 ? 'Bullish crossover' : rsi < 45 ? 'Bearish' : 'Neutral',
        avgVolume,
        relVolume: avgVolume > 0
          ? parseFloat(((q.regularMarketVolume || 0) / avgVolume).toFixed(2))
          : 1,
      },
      passesFilter:
        marketCapB >= 1 &&
        marketCapB <= 10 &&
        flow.largestOrder >= 30000 &&
        ivRank >= 80 &&
        flow.bullishFlowPct >= 70 &&
        flow.volOI > 0 &&
        flow.volOI < 0.5 &&
        flow.representativeDTE >= 15 &&
        flow.representativeDTE <= 60 &&
        flow.totalPremium > 0,
    };
  } catch (err) {
    console.error(`[buildTickerProfile] ${ticker}:`, err.message);
    return null;
  }
}

module.exports = { buildTickerProfile, calcLevels, calcRSI };
