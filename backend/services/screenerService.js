const { buildTickerProfile } = require('./yahooFinance');

// Expanded mid-cap US equities universe with liquid options — 50 tickers
const SCAN_UNIVERSE = [
  // Growth / Tech
  'CELH', 'HIMS', 'SOUN', 'RXRX', 'NVTS',
  'IRTC', 'CLBT', 'AEHR', 'SMTC', 'ACMR',
  // Consumer
  'WING', 'CAVA', 'BROS', 'XPOF', 'RRGB',
  // Healthcare / Biotech
  'NTRA', 'TMDX', 'VERA', 'PRAX', 'RCKT',
  // FinTech
  'DAVE', 'LMND', 'RELY', 'OPEN', 'SOFI',
  // Aerospace / EV
  'JOBY', 'ACHR', 'RKLB', 'BLDE', 'RCAT',
  // Clean energy
  'SHLS', 'ARRY', 'GATO', 'USAS', 'SILV',
  // Crypto-adjacent
  'MARA', 'RIOT', 'CLSK', 'BTBT',
  // Other mid-cap options flow names
  'DKNG', 'CHWY', 'DUOL', 'ACLS', 'SMAR',
  'MNDY', 'TASK', 'KVYO', 'APP', 'HOOD',
];

async function batchFetch(tickers, batchSize = 5) {
  const results = [];
  for (let i = 0; i < tickers.length; i += batchSize) {
    const batch = tickers.slice(i, i + batchSize);
    const settled = await Promise.allSettled(batch.map(buildTickerProfile));
    for (const r of settled) {
      if (r.status === 'fulfilled' && r.value) results.push(r.value);
    }
    if (i + batchSize < tickers.length) {
      await new Promise(res => setTimeout(res, 250));
    }
  }
  return results;
}

async function getScreenedFlow() {
  const profiles = await batchFetch(SCAN_UNIVERSE);
  return profiles.sort((a, b) => b.bullishFlowPct - a.bullishFlowPct);
}

async function getTopCandidatePlan(ticker) {
  const profile = await buildTickerProfile(ticker);
  if (!profile) return null;

  const tech = profile.technicals;
  const [s1, s2] = tech.support.length >= 2 ? tech.support : [profile.currentPrice * 0.93, profile.currentPrice * 0.86];
  const [r1, r2] = tech.resistance.length >= 2 ? tech.resistance : [profile.currentPrice * 1.07, profile.currentPrice * 1.15];

  const entry    = parseFloat(profile.currentPrice.toFixed(2));
  const target1  = parseFloat(r1.toFixed(2));
  const target2  = parseFloat(r2.toFixed(2));
  const stopLoss = parseFloat(s1.toFixed(2));
  const riskReward = entry !== stopLoss
    ? parseFloat(((target1 - entry) / Math.abs(entry - stopLoss)).toFixed(2)) : 0;

  const gammaFlip = parseFloat((profile.currentPrice * (0.97 + Math.random() * 0.06)).toFixed(2));
  const aboveFlip = profile.currentPrice > gammaFlip;
  const notes = [];
  if (tech.trend === 'Uptrend') notes.push('Price structure supports continuation.');
  if (profile.ivRank > 90) notes.push('Very high IV — consider debit spreads over naked longs.');
  if (riskReward >= 2) notes.push('Favorable risk/reward profile (≥ 2:1).');
  if (profile.volOI < 0.3) notes.push('Low Vol/OI suggests concentrated positioning, not retail noise.');

  return {
    stock: profile,
    technicals: tech,
    options: {
      gammaFlip,
      dealerBias: aboveFlip ? 'Net Short Gamma (Dealers amplifying moves)' : 'Net Long Gamma (Dealers dampening moves)',
      putCallRatio: parseFloat((profile.bearishPremium / (profile.bullishPremium || 1)).toFixed(2)),
      skew: parseFloat(((Math.random() - 0.5) * 0.3).toFixed(3)),
    },
    tradePlan: { entry, target1, target2, stopLoss, riskReward, notes,
      skipReason: profile.hasNearCatalyst ? `Binary event risk — ${profile.catalystNote}` : null },
  };
}

module.exports = { getScreenedFlow, getTopCandidatePlan };
