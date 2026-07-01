// Mock institutional options flow data for US mid-cap stocks ($1B-$10B market cap)
// This is simulated data for educational/demonstration purposes only

const MID_CAP_TICKERS = [
  { ticker: 'CELH', name: 'Celsius Holdings', marketCap: 4.2 },
  { ticker: 'WING', name: 'Wingstop Inc', marketCap: 7.8 },
  { ticker: 'CAVA', name: 'CAVA Group', marketCap: 9.1 },
  { ticker: 'KRTX', name: 'Karuna Therapeutics', marketCap: 2.4 },
  { ticker: 'RXRX', name: 'Recursion Pharma', marketCap: 3.6 },
  { ticker: 'JOBY', name: 'Joby Aviation', marketCap: 5.2 },
  { ticker: 'NVTS', name: 'Navitas Semiconductor', marketCap: 1.8 },
  { ticker: 'SMCI', name: 'Super Micro Computer', marketCap: 8.7 },
  { ticker: 'ACLS', name: 'Axcelis Technologies', marketCap: 3.1 },
  { ticker: 'CHWY', name: 'Chewy Inc', marketCap: 9.9 },
  { ticker: 'HIMS', name: 'Hims & Hers Health', marketCap: 4.5 },
  { ticker: 'MSTR', name: 'MicroStrategy', marketCap: 7.2 },
  { ticker: 'DKNG', name: 'DraftKings', marketCap: 6.8 },
  { ticker: 'RKLB', name: 'Rocket Lab USA', marketCap: 5.9 },
  { ticker: 'BBIO', name: 'BridgeBio Pharma', marketCap: 2.7 },
  { ticker: 'IRTC', name: 'iRhythm Technologies', marketCap: 3.3 },
  { ticker: 'NTRA', name: 'Natera Inc', marketCap: 8.4 },
  { ticker: 'TMDX', name: 'TransMedics Group', marketCap: 1.9 },
  { ticker: 'GATO', name: 'Gatos Silver', marketCap: 1.2 },
  { ticker: 'CLBT', name: 'Cellebrite DI', marketCap: 4.8 },
];

const EARNINGS_DATES = {
  'CELH': null,
  'WING': '2026-06-09', // within 7 days - flag
  'CAVA': null,
  'KRTX': null,
  'RXRX': '2026-06-07', // within 7 days - flag
  'JOBY': null,
  'NVTS': null,
  'SMCI': null,
  'ACLS': '2026-06-10', // within 7 days - flag
  'CHWY': null,
  'HIMS': null,
  'MSTR': null,
  'DKNG': '2026-06-06', // within 7 days - flag
  'RKLB': null,
  'BBIO': null,
  'IRTC': null,
  'NTRA': null,
  'TMDX': null,
  'GATO': null,
  'CLBT': null,
};

const FDA_DATES = {
  'KRTX': '2026-06-08', // within 7 days
  'BBIO': null,
  'RXRX': null,
};

function rand(min, max, decimals = 0) {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

function generateFlowData(seed = Date.now()) {
  // Seed-based pseudo-random for session consistency
  let s = seed;
  function seededRand(min, max, dec = 0) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const r = ((s >>> 0) / 0xffffffff) * (max - min) + min;
    return parseFloat(r.toFixed(dec));
  }

  const today = new Date();

  return MID_CAP_TICKERS.map((stock) => {
    const bullishFlowPct = seededRand(55, 95, 1);
    const bearishFlowPct = parseFloat((100 - bullishFlowPct).toFixed(1));
    const totalPremium = seededRand(80000, 2500000, 0);
    const bullishPremium = Math.round(totalPremium * (bullishFlowPct / 100));
    const bearishPremium = totalPremium - bullishPremium;
    const ivRank = seededRand(60, 99, 1);
    const volOI = seededRand(0.05, 0.95, 2);
    const largestOrder = seededRand(30000, 850000, 0);
    const dte = Math.round(seededRand(15, 60));

    const earningsDate = EARNINGS_DATES[stock.ticker];
    const fdaDate = FDA_DATES[stock.ticker] || null;
    const hasNearCatalyst = checkNearCatalyst(earningsDate, fdaDate, today);

    const passesFilter =
      stock.marketCap >= 1 &&
      stock.marketCap <= 10 &&
      largestOrder >= 30000 &&
      ivRank >= 80 &&
      bullishFlowPct >= 70 &&
      volOI < 0.5 &&
      dte >= 15 &&
      dte <= 60;

    return {
      ticker: stock.ticker,
      name: stock.name,
      marketCap: stock.marketCap,
      bullishPremium,
      bearishPremium,
      totalPremium,
      bullishFlowPct,
      bearishFlowPct,
      ivRank,
      volOI,
      largestOrder,
      dte,
      earningsDate,
      fdaDate,
      hasNearCatalyst,
      catalystNote: buildCatalystNote(earningsDate, fdaDate, today),
      passesFilter,
    };
  });
}

function checkNearCatalyst(earningsDate, fdaDate, today) {
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  if (earningsDate) {
    const diff = new Date(earningsDate) - today;
    if (diff >= 0 && diff <= sevenDays) return true;
  }
  if (fdaDate) {
    const diff = new Date(fdaDate) - today;
    if (diff >= 0 && diff <= sevenDays) return true;
  }
  return false;
}

function buildCatalystNote(earningsDate, fdaDate, today) {
  const notes = [];
  if (earningsDate && checkNearCatalyst(earningsDate, null, today)) {
    notes.push(`Earnings: ${earningsDate}`);
  }
  if (fdaDate && checkNearCatalyst(null, fdaDate, today)) {
    notes.push(`FDA Date: ${fdaDate}`);
  }
  return notes.join(' | ') || null;
}

function getScreenedFlow(sessionSeed) {
  const all = generateFlowData(sessionSeed);
  return all
    .filter((s) => s.passesFilter)
    .sort((a, b) => b.bullishFlowPct - a.bullishFlowPct);
}

function getTopCandidatePlan(ticker, sessionSeed) {
  const flow = getScreenedFlow(sessionSeed);
  const stock = flow.find((s) => s.ticker === ticker);
  if (!stock) return null;

  // Generate mock technical analysis
  const basePrice = rand(20, 180, 2);
  const trend = stock.bullishFlowPct > 80 ? 'Uptrend' : 'Sideways';
  const support1 = parseFloat((basePrice * rand(0.88, 0.93, 4)).toFixed(2));
  const support2 = parseFloat((basePrice * rand(0.80, 0.87, 4)).toFixed(2));
  const resistance1 = parseFloat((basePrice * rand(1.06, 1.12, 4)).toFixed(2));
  const resistance2 = parseFloat((basePrice * rand(1.13, 1.22, 4)).toFixed(2));
  const entry = parseFloat((basePrice * rand(0.995, 1.005, 4)).toFixed(2));
  const target1 = parseFloat((resistance1).toFixed(2));
  const target2 = parseFloat((resistance2).toFixed(2));
  const stopLoss = parseFloat((support1).toFixed(2));
  const riskReward = parseFloat(((target1 - entry) / (entry - stopLoss)).toFixed(2));

  const gammaFlip = parseFloat((basePrice * rand(0.97, 1.03, 4)).toFixed(2));
  const dealerBias = stock.bullishFlowPct > 75 ? 'Net Short Gamma (Dealers amplifying moves)' : 'Net Long Gamma (Dealers dampening moves)';

  return {
    stock,
    technicals: {
      currentPrice: basePrice,
      trend,
      support: [support1, support2],
      resistance: [resistance1, resistance2],
      rsi: rand(45, 75, 1),
      macdSignal: trend === 'Uptrend' ? 'Bullish crossover' : 'Neutral',
      avgVolume: Math.round(rand(800000, 5000000, 0)),
      relVolume: rand(0.8, 3.2, 2),
    },
    options: {
      gammaFlip,
      dealerBias,
      putCallRatio: rand(0.4, 0.9, 2),
      skew: rand(-0.15, 0.15, 3),
    },
    tradePlan: {
      entry,
      target1,
      target2,
      stopLoss,
      riskReward,
      notes: buildTradeNotes(stock, trend, riskReward),
      skipReason: stock.hasNearCatalyst ? `Binary event risk — ${stock.catalystNote}` : null,
    },
  };
}

function buildTradeNotes(stock, trend, rr) {
  const notes = [];
  if (trend === 'Uptrend') notes.push('Price structure supports continuation.');
  if (stock.ivRank > 90) notes.push('Very high IV — consider debit spreads over naked longs.');
  if (rr >= 2) notes.push('Favorable risk/reward profile (≥ 2:1).');
  if (stock.volOI < 0.3) notes.push('Low Vol/OI suggests concentrated positioning, not retail noise.');
  return notes;
}

module.exports = { generateFlowData, getScreenedFlow, getTopCandidatePlan };
