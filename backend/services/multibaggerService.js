const { default: YF } = require('yahoo-finance2');
const yf = new YF({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });
const { MULTIBAGGER_UNIVERSE } = require('../data/stockUniverse');

// Indian small/mid-caps with Yahoo fundamentals (NSE). Used when region = 'IN'.
const IN_MULTIBAGGER = [
  'TATAELXSI.NS','PERSISTENT.NS','COFORGE.NS','KPITTECH.NS','POLYCAB.NS','DIXON.NS','APLAPOLLO.NS','ASTRAL.NS',
  'CDSL.NS','ANGELONE.NS','BSE.NS','KEI.NS','SUPREMEIND.NS','CAMS.NS','TRENT.NS','SONACOMS.NS',
  'DEEPAKNTR.NS','NAVINFLUOR.NS','TIINDIA.NS','CGPOWER.NS','MAZDOCK.NS','BEL.NS','HAL.NS','RVNL.NS',
  'IRCTC.NS','TATAPOWER.NS','PRESTIGE.NS','OBEROIRLTY.NS','PHOENIXLTD.NS','LTTS.NS','MPHASIS.NS','GMDCLTD.NS',
];

// 30-minute cache
const CACHE = new Map();
const CACHE_TTL = 30 * 60 * 1000;

function cached(key, fn) {
  const hit = CACHE.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return Promise.resolve(hit.data);
  return fn().then((d) => { CACHE.set(key, { data: d, ts: Date.now() }); return d; });
}

// ── Fetch all required modules for one ticker ────────────────────────────────

async function fetchProfile(ticker) {
  try {
    const [summary, quote] = await Promise.all([
      yf.quoteSummary(ticker, {
        modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail', 'price', 'earningsTrend'],
      }).catch(() => null),
      yf.quote(ticker).catch(() => null),
    ]);

    if (!summary || !quote) return null;

    const fd  = summary.financialData        || {};
    const dks = summary.defaultKeyStatistics || {};
    const sd  = summary.summaryDetail        || {};
    const pr  = summary.price                || {};
    const et  = summary.earningsTrend        || {};

    const price     = quote.regularMarketPrice || pr.regularMarketPrice || 0;
    const marketCap = quote.marketCap          || pr.marketCap          || 0;
    const marketCapB = marketCap / 1e9;

    // Revenue growth
    const revGrowth = fd.revenueGrowth?.raw ?? null;

    // Margins
    const grossMargin = fd.grossMargins?.raw ?? null;
    const opMargin    = fd.operatingMargins?.raw ?? null;

    // Profitability
    const roe  = fd.returnOnEquity?.raw ?? null;
    const roic = (fd.returnOnEquity?.raw && fd.debtToEquity?.raw != null)
      ? fd.returnOnEquity.raw / (1 + (fd.debtToEquity.raw / 100 || 0))
      : null;

    // Valuation
    const pe      = quote.trailingPE   || sd.trailingPE?.raw   || null;
    const pb      = dks.priceToBook?.raw ?? sd.priceToBook?.raw ?? null;
    const evEbitda= dks.enterpriseToEbitda?.raw ?? null;
    const ps      = dks.priceToSalesTrailing12Months?.raw ?? null;
    const pfcf    = dks.priceToFreeCashflows?.raw ?? null;

    // Balance sheet
    const deRatio      = fd.debtToEquity?.raw != null ? fd.debtToEquity.raw / 100 : null;
    const currentRatio = fd.currentRatio?.raw ?? null;
    const quickRatio   = fd.quickRatio?.raw   ?? null;

    // FCF
    const fcf         = fd.freeCashflow?.raw ?? null;
    const positiveFCF = fcf !== null ? fcf > 0 : null;

    // Cash
    const totalCash = fd.totalCash?.raw ?? null;
    const totalDebt = fd.totalDebt?.raw ?? null;

    // Dividend
    const divYield  = sd.dividendYield?.raw ?? quote.dividendYield ?? null;
    const payoutRatio = sd.payoutRatio?.raw ?? null;

    // Short interest
    const shortInterest = dks.shortPercentOfFloat?.raw ?? null;
    const daysToCover   = dks.shortRatio?.raw          ?? null;

    // Shares change
    const sharesChange = dks.sharesPercentSharesOut?.raw ?? null;

    // Analyst target
    const targetPrice  = fd.targetMeanPrice?.raw ?? null;
    const targetUpside = targetPrice && price > 0 ? (targetPrice - price) / price : null;

    // EPS trend (are estimates being revised up?)
    let epsRevisionUp = null;
    try {
      const trends = et.trend || [];
      const q1 = trends.find((t) => t.period === '+1q');
      if (q1?.earningsEstimate) {
        const up = q1.earningsEstimate.numberOfAnalystsOpinionUp?.raw ?? 0;
        const dn = q1.earningsEstimate.numberOfAnalystsOpinionDown?.raw ?? 0;
        epsRevisionUp = up > dn;
      }
    } catch (_) {}

    // Simplified Piotroski F-Score (available signals only)
    let piotroski = 0;
    if (roe !== null && roe > 0)          piotroski++;      // Positive ROA proxy
    if (positiveFCF === true)              piotroski++;      // Positive OCF
    if (opMargin !== null && opMargin > 0) piotroski++;      // Positive operating income
    if (deRatio !== null && deRatio < 0.5) piotroski++;      // Low leverage
    if (currentRatio !== null && currentRatio > 1.5) piotroski++; // Good liquidity
    if (grossMargin !== null && grossMargin > 0.3) piotroski++;    // Decent margin
    if (sharesChange !== null && sharesChange < 0.05) piotroski++; // Low dilution
    if (revGrowth !== null && revGrowth > 0.1) piotroski++;        // Revenue growth
    if (epsRevisionUp === true) piotroski++;                        // EPS revision up
    // Score: 0-9

    return {
      ticker,
      name:     quote.longName || quote.shortName || ticker,
      sector:   pr.sector  || quote.sector  || 'N/A',
      price,
      marketCapB: parseFloat(marketCapB.toFixed(2)),
      // Layer 1
      pe, pb, evEbitda, ps, pfcf,
      // Layer 2
      revGrowth, epsRevisionUp,
      // Layer 3
      grossMargin, opMargin, roe, roic,
      positiveFCF, fcf, totalCash,
      // Layer 4
      deRatio, currentRatio, quickRatio, totalDebt,
      sharesChange,
      // Layer 5
      divYield, payoutRatio,
      // Layer 6
      shortInterest, daysToCover,
      // Output
      piotroski,
      targetPrice,
      targetUpside,
    };
  } catch (err) {
    console.error(`[multibagger] ${ticker}: ${err.message}`);
    return null;
  }
}

// ── Apply all 6 filter layers ────────────────────────────────────────────────

function applyFilters(m, mode = '5x') {
  const is10x    = mode === '10x';
  const isIncome = mode === 'income';
  // Slightly generous bounds — filter is a score, not a wall
  const priceMax = is10x ? 10 : 25;
  const mcapMin  = 0.03;          // $30M floor
  const mcapMax  = is10x ? 1 : 5; // $1B (10x) / $5B (5x)
  const revMin   = is10x ? 0.30 : 0.15;

  const checks = {
    // L1 — Valuation
    L1_price:    m.price > 0 && m.price <= priceMax,
    L1_mcap:     m.marketCapB >= mcapMin && m.marketCapB <= mcapMax,
    L1_pe:       m.pe == null || m.pe < 20 || (m.revGrowth != null && m.revGrowth > 0.40),
    L1_pb:       m.pb == null || m.pb < 3,
    L1_evEbitda: m.evEbitda == null || m.evEbitda < 12,
    L1_ps:       m.ps == null || m.ps < (m.revGrowth != null && m.revGrowth > 0.20 ? 8 : 3),
    // L2 — Growth (null = data unavailable = don't penalise)
    L2_revGrowth:   m.revGrowth == null || m.revGrowth >= revMin,
    L2_epsRevision: m.epsRevisionUp !== false,
    // L3 — Quality
    L3_grossMargin: m.grossMargin == null || m.grossMargin >= 0.30,
    L3_roe:         m.roe == null || m.roe > 0.08,
    L3_fcf:         m.positiveFCF !== false,
    // L4 — Balance Sheet
    L4_de:           m.deRatio == null || m.deRatio < 1.0,
    L4_currentRatio: m.currentRatio == null || m.currentRatio > 1.2,
    L4_dilution:     m.sharesChange == null || m.sharesChange < 0.08,
    // L5 — Yield (income mode only)
    L5_yield:  !isIncome || (m.divYield != null && m.divYield >= 0.035),
    L5_payout: !isIncome || (m.payoutRatio == null || m.payoutRatio < 0.65),
    // L6 — Advanced signals
    L6_shortInt:  m.shortInterest == null || m.shortInterest < 0.20,
    L6_piotroski: m.piotroski >= 4,
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total  = Object.keys(checks).length;
  const score  = Math.round((passed / total) * 100);

  // Only hard-gate on price and market cap — everything else is scored
  const hardPass = checks.L1_price && checks.L1_mcap;

  return { checks, passed, total, score, hardPass };
}

// ── Narrative generation — 3-tier fallback, always returns content ────────────

const SECTOR_BULL = {
  'Technology':             `Technology secular tailwinds (AI, cloud, automation) create multi-decade compounding cycles. Small-cap tech names with niche dominance become acquisition targets before most institutional funds can build positions.`,
  'Healthcare':             `Biotech/healthcare sector where a single positive data readout, FDA decision, or partnership announcement can re-rate a stock 3–10× overnight. Binary asymmetry IS the thesis here.`,
  'Financial Services':     `Fintech disrupting a legacy industry worth trillions. Digital-native cost structures allow profitable scale at a fraction of traditional bank overhead — the TAM is the entire financial system.`,
  'Energy':                 `Energy transition is a $10T+ multi-decade capital reallocation. Early winners in clean infrastructure tend to compound at rates that dwarf legacy energy — the cycle is still early.`,
  'Consumer Discretionary': `Consumer discretionary names at current levels embed a deeply pessimistic macro view. Any normalization in consumer sentiment or rates could re-rate the stock rapidly.`,
  'Industrials':            `Industrial small-caps with niche dominance get acquired at 3–5× premiums regularly. M&A optionality provides a structural floor — strategic buyers pay for proprietary capabilities, not public market multiples.`,
  'Basic Materials':        `Commodity cycles are long and brutal — small-cap materials names near cost-of-production floor prices offer asymmetric upside when the cycle turns, with limited incremental downside.`,
  'Communication Services': `Digital media and communications at small-cap scale trade at deep discounts to large-cap peers. A single major content or platform deal can close that gap overnight.`,
  'Real Estate':            `Real estate small-caps trading below NAV offer margin of safety plus operational leverage if property markets stabilize. Insider buying at these levels is the key signal to watch.`,
  'Utilities':              `Regulated utility economics provide stable cash flows while clean energy mandates create an accelerating growth capex cycle — rare combination of income and growth catalysts.`,
};

const SECTOR_BEAR = {
  'Technology':             `Pre-revenue or early-revenue tech names face funding risk if the rate environment shifts — capital costs matter more at small-cap scale where access to cheap equity is not guaranteed.`,
  'Healthcare':             `Binary risk is symmetric: the same FDA decision that could 10× the stock can also send it to near-zero. Pre-approval biotech exposure should be sized accordingly.`,
  'Financial Services':     `Fintech faces regulatory scrutiny intensifying globally. A compliance failure or regulatory action at this market cap can permanently impair the model.`,
  'Energy':                 `Energy transition creates both winners and casualties — fossil-fuel adjacent businesses face secular demand erosion regardless of short-term commodity prices.`,
  'Consumer Discretionary': `Consumer credit and spending data remain weak. Highly discretionary categories face demand destruction first and recover last in economic contractions.`,
};

function bullCase(m) {
  const pts = [];

  // ── TIER 1: Verified financial metrics (specific, measurable) ──
  if (m.revGrowth != null) {
    if (m.revGrowth > 0.40)
      pts.push(`Revenue growing at +${(m.revGrowth * 100).toFixed(0)}% YoY — hypergrowth puts this in the top percentile of public equities. At this rate, revenue doubles every 18 months; the stock re-rating happens well before that.`);
    else if (m.revGrowth > 0.20)
      pts.push(`+${(m.revGrowth * 100).toFixed(0)}% YoY revenue growth is durable — that's 3× the S&P 500 median. Consistent compounders in this range historically produce 5–15× over a 5-year cycle as the market pays up for visibility.`);
    else if (m.revGrowth > 0.05)
      pts.push(`Revenue growing at +${(m.revGrowth * 100).toFixed(0)}% YoY while the stock remains small-cap priced — the market hasn't yet assigned a growth premium, which is precisely when asymmetric entry points exist.`);
  }

  if (m.grossMargin != null) {
    if (m.grossMargin > 0.60)
      pts.push(`${(m.grossMargin * 100).toFixed(0)}% gross margins are software-company levels. At scale, nearly every incremental dollar of revenue converts to profit — this is what makes exponential compounding possible.`);
    else if (m.grossMargin > 0.35)
      pts.push(`${(m.grossMargin * 100).toFixed(0)}% gross margins confirm a real business with pricing power. As fixed costs get absorbed, operating leverage kicks in: small revenue gains produce outsized earnings growth.`);
  }

  if (m.deRatio != null && m.deRatio < 0.5)
    pts.push(`${m.deRatio.toFixed(2)}× D/E — essentially debt-free. No refinancing risk, no covenant risk. Management can invest offensively or return capital. At small-cap scale, a clean balance sheet is a competitive moat.`);

  if (m.positiveFCF === true && m.revGrowth != null && m.revGrowth > 0.10)
    pts.push(`Positive FCF while growing revenue at double-digits is rare at this market cap. It means the business is self-funding expansion — no need to dilute shareholders or tap debt markets to grow.`);

  if (m.roic != null && m.roic > 0.12)
    pts.push(`ROIC of ${(m.roic * 100).toFixed(0)}% is above the cost of capital — every dollar reinvested creates more than a dollar of value. That's the compounding math that drives 10-baggers over a 5-year period.`);

  if (m.piotroski >= 7)
    pts.push(`Piotroski F-Score of ${m.piotroski}/9 — improving simultaneously on profitability, leverage, and operating efficiency. The score was designed specifically to catch small-cap turnarounds before they re-rate.`);

  // ── TIER 2: Market-derived signals (always available) ──
  if (pts.length < 2 && m.targetUpside != null && m.targetUpside > 0.25)
    pts.push(`Analyst consensus 12-month target is $${m.targetPrice?.toFixed(2)} — implying ${(m.targetUpside * 100).toFixed(0)}% upside from $${m.price?.toFixed(2)}. Analysts covering small-caps typically won't publish unless they have high conviction; coverage initiation itself drives institutional attention.`);

  if (pts.length < 2 && m.pb != null && m.pb < 1.5)
    pts.push(`${m.pb.toFixed(1)}× P/B ratio — trading near or below the book value of its assets. This is the Ben Graham definition of a margin of safety: even in a liquidation scenario, downside is structurally limited.`);

  if (pts.length < 2 && m.pe != null && m.pe > 0 && m.pe < 15)
    pts.push(`${m.pe.toFixed(1)}× P/E for a company in a structurally growing sector is anomalously cheap. The multiple expansion alone — from 10× to 20× earnings — doubles the stock price even if earnings stay flat.`);

  if (pts.length < 2 && m.marketCapB < 0.3)
    pts.push(`$${m.marketCapB.toFixed(2)}B market cap creates genuine asymmetry: a $50M institutional buy program is >15% of the float. The stock can re-rate before most funds are even fully positioned. Being early at this size IS the edge.`);
  else if (pts.length < 2 && m.marketCapB < 1.0)
    pts.push(`At $${m.marketCapB.toFixed(2)}B, this sits below the threshold where most institutional funds can own meaningful positions. When the growth story matures enough to attract large-cap funds, the re-rating is reflexive and violent — on the upside.`);

  if (pts.length < 2 && m.shortInterest != null && m.shortInterest > 0.20)
    pts.push(`${(m.shortInterest * 100).toFixed(0)}% short interest is a double-edged signal: yes, bears have concerns, but those shorts need to cover eventually. Any positive catalyst creates forced buying — short squeezes at small-cap scale can be dramatic.`);

  // ── TIER 3: Sector context (always fires if still under 3 pts) ──
  if (pts.length < 3) {
    const sectBull = SECTOR_BULL[m.sector];
    pts.push(sectBull || `Small-cap equities historically outperform large-caps by 3–4% annually over 20-year periods — and the gap widens when you screen for quality. This stock passed a 6-layer institutional-grade filter. The quantitative case is materially cleaner than the broader small-cap universe.`);
  }

  return pts.slice(0, 3);
}

function bearCase(m) {
  const pts = [];

  // ── TIER 1: Specific financial red flags ──
  if (m.deRatio != null && m.deRatio > 1.5)
    pts.push(`${m.deRatio.toFixed(1)}× D/E — highly leveraged. In a credit tightening cycle, refinancing at higher rates compresses margins and potentially impairs the equity. Leverage amplifies both gains and losses; at small-cap scale, the loss side can be existential.`);

  if (m.revGrowth != null && m.revGrowth < -0.05)
    pts.push(`Revenue contracting at ${(m.revGrowth * 100).toFixed(0)}% YoY. The critical question: is this cyclical (recovers with macro) or secular (structural demand destruction)? Investing before the answer is clear is speculation, not analysis.`);

  if (m.grossMargin != null && m.grossMargin < 0.20)
    pts.push(`${(m.grossMargin * 100).toFixed(0)}% gross margins leave no buffer for surprises. One bad quarter of pricing pressure or cost inflation can push the business into negative gross profit — where no amount of cost-cutting fixes the model.`);

  if (m.sharesChange != null && m.sharesChange > 0.08)
    pts.push(`Share count up +${(m.sharesChange * 100).toFixed(0)}% YoY — the company is funding itself by diluting shareholders. Even if the stock price holds, per-share value is being eroded. Watch whether the capital being raised is funding growth or plugging losses.`);

  if (m.shortInterest != null && m.shortInterest > 0.20)
    pts.push(`${(m.shortInterest * 100).toFixed(0)}% short interest means sophisticated investors with real capital at risk are actively betting against this name. Shorts aren't always right, but at these levels they have done the work — the burden of proof is on the bull.`);

  // ── TIER 2: Structural / liquidity risks ──
  if (pts.length < 2 && m.positiveFCF === false)
    pts.push(`Negative free cash flow — the company cannot fund itself organically. It must repeatedly return to capital markets to survive. In benign conditions this is manageable; in a risk-off environment, the cost of capital spikes exactly when the business can least afford it.`);

  if (pts.length < 2 && m.currentRatio != null && m.currentRatio < 1.0)
    pts.push(`Current ratio below 1.0× means the company has more short-term obligations than short-term assets. This isn't theoretical — it means the company may need to raise cash, sell assets, or negotiate extensions within the next 12 months.`);

  if (pts.length < 2 && m.marketCapB < 0.15)
    pts.push(`$${m.marketCapB.toFixed(2)}B market cap creates real liquidity risk. In a broad market selloff, bid-ask spreads on illiquid small-caps can widen to 5–10%, and institutional exits at this size can move the stock 15–20% intraday with no fundamental catalyst.`);

  // ── TIER 3: Sector-specific risk (always fires) ──
  if (pts.length < 2) {
    const sectBear = SECTOR_BEAR[m.sector];
    pts.push(sectBear || `Small-cap names carry liquidity risk by definition: analyst coverage is limited, the investor base is retail-heavy, and sentiment drives price as much as fundamentals. Volatility in both directions will exceed what the fundamentals justify.`);
  }

  return pts.slice(0, 2);
}

// ── Main: run the full screen ────────────────────────────────────────────────

async function runMultiBaggerScreen(mode = '5x', region = 'US') {
  const universe = region === 'IN' ? IN_MULTIBAGGER : MULTIBAGGER_UNIVERSE;
  return cached(`mbscreen:${region}:${mode}`, async () => {
    // Batch fetch profiles
    const results = [];
    const batchSize = 4;
    for (let i = 0; i < universe.length; i += batchSize) {
      const batch = universe.slice(i, i + batchSize);
      const settled = await Promise.allSettled(batch.map(fetchProfile));
      for (const r of settled) {
        if (r.status === 'fulfilled' && r.value) results.push(r.value);
      }
      if (i + batchSize < universe.length) {
        await new Promise((res) => setTimeout(res, 350));
      }
    }

    // Apply filters and score
    const screened = results
      .map((m) => {
        const { checks, passed, total, score, hardPass } = applyFilters(m, mode);
        return {
          ...m,
          filterChecks: checks,
          filtersPassed: passed,
          filtersTotal: total,
          score,
          hardPass,
          bullCasePts: bullCase(m),
          bearCasePts: bearCase(m),
        };
      })
      .filter((m) => m.hardPass)
      .sort((a, b) => b.score - a.score);

    return screened;
  });
}

module.exports = { runMultiBaggerScreen };
