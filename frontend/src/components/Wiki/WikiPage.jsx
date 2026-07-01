import { useState } from 'react';
import { LegalDoc } from '../Legal/legalContent.jsx';

const SECTIONS = [
  {
    id: 'about', icon: '📋', label: 'About InvestRite',
    content: AboutSection,
  },
  {
    id: 'screener', icon: '📊', label: 'Flow Screener',
    content: ScreenerSection,
  },
  {
    id: 'multibagger', icon: '🚀', label: 'Multi-Bagger',
    content: MultiBaggerSection,
  },
  {
    id: 'portfolio', icon: '💼', label: 'Portfolio',
    content: PortfolioSection,
  },
  {
    id: 'tradeplan', icon: '🎯', label: 'Trade Plan',
    content: TradePlanSection,
  },
  {
    id: 'glossary', icon: '📖', label: 'Glossary',
    content: GlossarySection,
  },
  {
    id: 'legal', icon: '⚖️', label: 'Terms & Privacy',
    content: LegalSection,
  },
];

function SectionTitle({ children }) {
  return (
    <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 26, fontWeight: 400, color: '#fff', letterSpacing: '-0.02em', marginBottom: 8 }}>
      {children}
    </h2>
  );
}

function P({ children, muted }) {
  return (
    <p style={{ fontFamily: 'Inter', fontSize: 14, lineHeight: 1.75, color: muted ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.7)', marginBottom: 14 }}>
      {children}
    </p>
  );
}

function H3({ children, color = '#a78bfa' }) {
  return (
    <h3 style={{ fontFamily: 'Manrope', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color, marginTop: 24, marginBottom: 10 }}>
      {children}
    </h3>
  );
}

function Term({ term, def }) {
  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ fontFamily: 'Cabin', fontSize: 13, fontWeight: 600, color: '#c4b5fd', marginBottom: 4 }}>{term}</div>
      <div style={{ fontFamily: 'Inter', fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{def}</div>
    </div>
  );
}

function Note({ children }) {
  return (
    <div style={{ background: 'rgba(123,57,252,0.07)', border: '1px solid rgba(123,57,252,0.2)', borderRadius: 10, padding: '12px 16px', margin: '14px 0' }}>
      <span style={{ fontFamily: 'Manrope', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a78bfa', display: 'block', marginBottom: 4 }}>Note</span>
      <div style={{ fontFamily: 'Inter', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

function Warning({ children }) {
  return (
    <div style={{ background: 'rgba(255,209,102,0.06)', border: '1px solid rgba(255,209,102,0.2)', borderRadius: 10, padding: '12px 16px', margin: '14px 0' }}>
      <span style={{ fontFamily: 'Manrope', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ffd166', display: 'block', marginBottom: 4 }}>⚠ Important</span>
      <div style={{ fontFamily: 'Inter', fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

/* ── Sections ──────────────────────────────────────────────────────────────── */

function AboutSection() {
  return (
    <>
      <SectionTitle>About InvestRite</SectionTitle>
      <Warning>
        InvestRite is a <strong>demonstration product</strong> built for educational purposes only. All data is sourced from Yahoo Finance's unofficial API and may be inaccurate, delayed, or incomplete. Nothing on this platform constitutes investment, financial, or trading advice. Options trading involves substantial risk of loss and is not suitable for all investors. You can lose your entire investment and more. InvestRite is not registered with the SEC, FINRA, or any state securities authority.
      </Warning>
      <P>
        InvestRite is a free educational tool that helps you explore institutional options flow data across US mid-cap equities. It is designed to teach you how to read options flow, screen for unusual activity, and build structured trade setups — not to give you financial advice.
      </P>
      <H3>What it does</H3>
      <P>InvestRite connects to Yahoo Finance's free data API and pulls live options chain data for a curated list of ~60 US small and mid-cap stocks. It then applies a multi-layer screening formula to identify stocks with unusual bullish or bearish options activity, calculates approximate IV Rank from realized volatility, and generates a structured trade plan with entry, target, and stop-loss levels.</P>
      <H3>What it doesn't do</H3>
      <P>InvestRite does not access real institutional dark pool data, actual block trade feeds, or premium options flow services (like Unusual Whales, Cheddar Flow, or Market Chameleon). The "institutional flow" you see is a best approximation based on publicly available Yahoo Finance data.</P>
      <Note>The multi-bagger screener uses fundamental financial ratios. All financial data is fetched from Yahoo Finance and may have gaps, especially for micro-cap or recently listed companies.</Note>
      <H3>Getting Started</H3>
      <P>1. Create a free account — no credit card required, backed by Firebase Authentication.</P>
      <P>2. Head to the <strong style={{ color: '#c4b5fd' }}>Flow Screener</strong> tab to see the current session's options flow ranked by bullish %. Hover over any filter chip to edit the thresholds.</P>
      <P>3. Use <strong style={{ color: '#c4b5fd' }}>Multi-Bagger</strong> to run a fundamental screen across 60 small-cap stocks using the 6-layer formula.</P>
      <P>4. Add your holdings to <strong style={{ color: '#c4b5fd' }}>Portfolio</strong> (manually or via CSV import) to track cost basis.</P>
      <P>5. Click "Plan →" on any screened ticker to generate a structured <strong style={{ color: '#c4b5fd' }}>Trade Plan</strong> with technical levels, gamma exposure, and exit rules.</P>
    </>
  );
}

function ScreenerSection() {
  return (
    <>
      <SectionTitle>Flow Screener</SectionTitle>
      <P>The Flow Screener is the core tool of InvestRite. It scans a curated universe of US mid-cap equities, fetches their live options chain from Yahoo Finance, and scores each stock on 6 criteria to identify where unusual institutional-style activity is concentrated.</P>
      <H3>How to read the table</H3>
      <Term term="Ticker" def="The stock symbol. Click 'Plan →' to generate a trade plan for that ticker." />
      <Term term="Mkt Cap" def="Current market capitalization. The screener focuses on $1B–$10B — large enough for liquid options, small enough for meaningful price impact." />
      <Term term="Bull Premium" def="Total dollar premium paid for call options (DTE 15–60) in the current session. Green = bullish money." />
      <Term term="Bear Premium" def="Total dollar premium paid for put options. Red = bearish money." />
      <Term term="Flow %" def="Bullish premium as a percentage of total premium. 80%+ = very strong directional conviction to the upside." />
      <Term term="IV Rank" def="Where current implied volatility sits in its 52-week range (approximated from realized volatility). 80%+ = elevated IV, ideal for detecting premium bets." />
      <Term term="Largest Order" def="The single largest options order by premium in the 15–60 DTE range. Institutional orders typically print $100K–$2M+." />
      <Term term="Vol/OI" def="Volume divided by Open Interest. Under 0.5 = positions built over multiple days (institutional). Over 1.0 = likely retail momentum." />
      <Term term="DTE" def="Days to expiration for the representative contract window (15–60 days)." />
      <Term term="Screen" def="Green dot = passes all 6 filter criteria. Gray = fails one or more. Hover for details." />
      <H3>Editing filters</H3>
      <P>Every filter chip in the bar above the table is editable. Hover over any chip (Mkt Cap, IV Rank, etc.) to see a popup explaining the filter and an input to change the threshold. Changes apply instantly to the table — click Apply to confirm.</P>
      <Warning>Lowering thresholds will show more results but will also include more noise. The defaults are set to filter for genuinely unusual activity.</Warning>
    </>
  );
}

function MultiBaggerSection() {
  return (
    <>
      <SectionTitle>Multi-Bagger Screener</SectionTitle>
      <P>The Multi-Bagger Screener applies a 6-layer fundamental analysis formula across ~60 US small and micro-cap stocks to find candidates with 5× or 10× return potential. It is inspired by institutional equity research frameworks and the Piotroski F-Score methodology.</P>
      <H3>The 6 Layers</H3>
      <Term term="Layer 1 — Valuation" def="Screens for stocks trading at reasonable multiples: P/E < 20×, P/B < 3×, EV/EBITDA < 12×, P/S < 3–8×. Price < $20 (5× mode) or < $10 (10× mode)." />
      <Term term="Layer 2 — Growth" def="Revenue growth ≥ 20% YoY (5×) or ≥ 40% (10×). Also checks EPS revision direction from analyst estimates." />
      <Term term="Layer 3 — Quality" def="Gross margin ≥ 35%, positive FCF preferred, ROE > 12%, ROIC > 10%. These signal a real business with durable unit economics." />
      <Term term="Layer 4 — Balance Sheet" def="D/E < 1×, current ratio > 1.5×, share dilution < 8% YoY. Protects against blowups from leverage or equity dilution." />
      <Term term="Layer 5 — Yield Overlay" def="Only enforced in 'Income/Yield' mode. Dividend yield > 3.5%, payout ratio < 65%, sustainable FCF coverage." />
      <Term term="Layer 6 — Advanced Signals" def="Short interest < 20%, Piotroski F-Score ≥ 4, EPS estimates trending upward." />
      <H3>Composite Score</H3>
      <P>Each stock receives a composite score (0–100) based on how many sub-criteria it passes across all 6 layers. The score ring in the table is color-coded: green (≥75), yellow (≥50), red (&lt;50).</P>
      <H3>Bull / Bear Narratives</H3>
      <P>Expanding a row shows a data-driven bull case (why the stock could 5–10×) and bear case (key risks). These are generated algorithmically from the financial data — not from an AI or analyst. They use a tiered fallback: specific financial metrics first, then market signals, then sector context.</P>
      <Note>The 6-month price chart is fetched live from Yahoo Finance when you expand a row. It is cached for 5 minutes.</Note>
    </>
  );
}

function PortfolioSection() {
  return (
    <>
      <SectionTitle>Portfolio</SectionTitle>
      <P>The Portfolio tab lets you track your holdings by cost basis. Data is stored in Firebase Firestore and persists across browser sessions and app restarts — unlike the screener data which is fetched fresh each session.</P>
      <H3>Adding positions</H3>
      <P>Click "Add Position" and fill in the ticker, number of shares, average cost, and optional notes (e.g. your entry reason). The portfolio will automatically calculate cost basis, position size, and % allocation.</P>
      <H3>CSV Import</H3>
      <P>You can bulk-import positions from a CSV file. The minimum required headers are: <code style={{ fontFamily: 'monospace', color: '#c4b5fd', background: 'rgba(123,57,252,0.12)', padding: '1px 5px', borderRadius: 4 }}>ticker, shares, avgCost</code></P>
      <P>Optional columns: <code style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4 }}>notes, symbol, quantity, price</code></P>
      <P>Re-importing a CSV that includes a ticker you already hold will <strong style={{ color: '#c4b5fd' }}>update</strong> that position's shares and average cost in place — it won't create a duplicate. (Notes are only overwritten if your CSV provides a new note.)</P>
      <H3>Deleting positions</H3>
      <P>Hover over any row to reveal the trash icon next to the ticker. First click arms the delete (shows "Confirm?"), second click removes it. The confirmation auto-cancels after 3 seconds if you don't proceed.</P>
      <Warning>Portfolio data is stored per Firebase user account. If you delete your account, the portfolio data is also deleted. There is no export function currently.</Warning>
    </>
  );
}

function TradePlanSection() {
  return (
    <>
      <SectionTitle>Trade Plan Generator</SectionTitle>
      <P>The Trade Plan Generator produces a structured setup for any ticker that has passed the Flow Screener. It combines Yahoo Finance price data with simulated technical analysis to give you an entry, two targets, and a stop-loss.</P>
      <Warning>Trade plans are generated from simulated technical analysis — not from a real charting engine or professional analyst. The support/resistance levels are calculated from 60-day pivot points on Yahoo Finance historical data. Do not treat these as actionable recommendations.</Warning>
      <H3>Sections explained</H3>
      <Term term="Catalyst Check" def="Checks Yahoo Finance earnings calendar for dates within the next 7 days. If there's a binary event (earnings, FDA date), the plan flags it as 'Skip' — holding options through binary events turns a flow trade into a pure gamma bet." />
      <Term term="Technical Setup" def="Trend direction (based on RSI slope), RSI value, MACD signal, average volume, and relative volume vs 10-day average." />
      <Term term="Key Price Levels" def="Resistance 1 & 2 (pivot highs above current price) and Support 1 & 2 (pivot lows below). Distances shown as % from current price." />
      <Term term="Options Positioning" def="Simulated gamma flip level, dealer bias (net long/short gamma), put/call ratio from the options chain, and volatility skew." />
      <Term term="Structured Trade Plan" def="Entry (near current price), Target 1 (Resistance 1), Target 2 (Resistance 2 stretch), Stop Loss (below Support 1). Risk/Reward ratio shown." />
      <Term term="Exit Rules" def="Profit exit: take 50% at T1, trail the rest to break-even. Loss exit: hard stop at support, or 50% premium loss, or thesis invalidation. Never hold through binary events." />
    </>
  );
}

function GlossarySection() {
  return (
    <>
      <SectionTitle>Glossary</SectionTitle>
      <H3>Options Terms</H3>
      <Term term="IV (Implied Volatility)" def="The market's expectation of future price movement embedded in option prices. High IV = expensive options = market expects big moves." />
      <Term term="IV Rank" def="Where current IV sits relative to its 52-week range. IV Rank of 80% means IV is in the top 20% of the past year — elevated and potentially signaling an upcoming event." />
      <Term term="DTE (Days to Expiration)" def="How many days until the options contract expires. 15–60 days is the institutional sweet spot — enough time for the thesis, not excessive time decay." />
      <Term term="Open Interest (OI)" def="Total number of outstanding options contracts. High OI on a specific strike suggests it's a key level institutions are watching." />
      <Term term="Volume / Open Interest (Vol/OI)" def="Daily volume divided by OI. Under 0.5 = positions being built over multiple days (institutional). Over 1.0 = retail day-trading noise." />
      <Term term="Premium" def="The dollar cost of an options contract. Total premium = (bid + ask) / 2 × volume × 100 (contract multiplier)." />
      <Term term="Gamma Flip" def="The price level at which market makers (dealers) switch from amplifying price moves (net short gamma) to dampening them (net long gamma). A key institutional level." />
      <Term term="Options Flow" def="The aggregate of all options orders in a session. Bullish flow = more call premium than put premium. A proxy for directional conviction." />
      <H3>Fundamental Terms</H3>
      <Term term="P/E Ratio" def="Price / Earnings. How much you pay for $1 of earnings. Under 20× is the screener threshold for non-hypergrowth stocks." />
      <Term term="P/B Ratio" def="Price / Book Value. Under 1.5× means you're near or below the net asset value of the business — a margin of safety." />
      <Term term="EV/EBITDA" def="Enterprise Value / Earnings Before Interest, Tax, Depreciation & Amortization. A cleaner valuation multiple than P/E. Under 12× is the screener threshold." />
      <Term term="ROIC" def="Return on Invested Capital. How efficiently the company generates profit from every dollar invested. Consistently above 10% is a hallmark of a compounding business." />
      <Term term="Piotroski F-Score" def="A 0–9 score measuring financial health across 9 signals: profitability (3), leverage/liquidity (3), operating efficiency (3). InvestRite approximates it from available Yahoo Finance data. ≥6 is the threshold." />
      <Term term="FCF (Free Cash Flow)" def="Cash generated after capital expenditures. Positive FCF means the business funds its own growth — no need to dilute shareholders or take on debt." />
      <Term term="D/E Ratio (Debt/Equity)" def="Total debt divided by shareholder equity. Under 1× is healthy. Over 2× is elevated leverage risk, especially in rising-rate environments." />
      <H3>Chart & Technical Terms</H3>
      <Term term="RSI (Relative Strength Index)" def="A momentum indicator (0–100). Under 40 = oversold. Over 70 = overbought. 40–70 is the screener sweet spot — not extended in either direction." />
      <Term term="Support" def="A price level where buying has historically stopped a decline. Calculated from 60-day pivot lows in InvestRite." />
      <Term term="Resistance" def="A price level where selling has historically capped advances. Calculated from 60-day pivot highs in InvestRite." />
      <Term term="Rel Volume" def="Today's volume vs 10-day average. 1.5× or higher means elevated interest — worth watching." />
    </>
  );
}

function LegalSection() {
  return (
    <>
      <SectionTitle>Terms & Privacy</SectionTitle>
      <P>
        InvestRite is a free, non-commercial hobby project by <strong style={{ color: '#c4b5fd' }}>Akshat Barjatya</strong>. It makes no money, runs no ads, and is not a financial adviser — everything here is for education only. The full Terms and Privacy notice are reproduced below, and can be opened any time from the footer links or your Profile page.
      </P>
      <H3>Terms &amp; Conditions</H3>
      <LegalDoc doc="terms" />
      <div style={{ height: 28 }} />
      <H3>Privacy &amp; Data Notice</H3>
      <LegalDoc doc="privacy" />
    </>
  );
}

/* ── Main component ────────────────────────────────────────────────────────── */
export default function WikiPage() {
  const [active, setActive] = useState('about');
  const ActiveSection = SECTIONS.find(s => s.id === active)?.content || AboutSection;

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 'calc(100vh - 70px)', maxWidth: 1000, margin: '0 auto' }}>

      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0, padding: '24px 0',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.01)',
      }}>
        <div style={{ padding: '0 20px', marginBottom: 20 }}>
          <div style={{ fontFamily: 'Manrope', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.25)', marginBottom: 2 }}>InvestRite</div>
          <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, color: '#fff', fontWeight: 400 }}>Documentation</div>
        </div>

        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 20px', border: 'none', cursor: 'pointer', textAlign: 'left',
              fontFamily: 'Manrope', fontSize: 13, fontWeight: active === s.id ? 600 : 500,
              background: active === s.id ? 'rgba(123,57,252,0.12)' : 'transparent',
              color: active === s.id ? '#c4b5fd' : 'rgba(255,255,255,0.45)',
              borderRight: active === s.id ? '2px solid #7b39fc' : '2px solid transparent',
              transition: 'all .15s',
            }}
            onMouseEnter={e => { if (active !== s.id) { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}}
            onMouseLeave={e => { if (active !== s.id) { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.background = 'transparent'; }}}
          >
            <span style={{ fontSize: 16 }}>{s.icon}</span>
            {s.label}
          </button>
        ))}

        {/* Demo badge */}
        <div style={{ margin: '24px 20px 0', padding: '10px 12px', background: 'rgba(255,77,109,0.07)', border: '1px solid rgba(255,77,109,0.18)', borderRadius: 10 }}>
          <div style={{ fontFamily: 'Manrope', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ff4d6d', marginBottom: 4 }}>Demo / Hobby Project</div>
          <div style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>A free project by Akshat Barjatya. Not investment advice. Yahoo Finance data only.</div>
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px 48px', maxWidth: 780 }}>
        <ActiveSection />
        <div style={{ marginTop: 48, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgba(255,255,255,0.2)', lineHeight: 1.7 }}>
            InvestRite is a demonstration product. All data sourced from Yahoo Finance (unofficial API). Not affiliated with any brokerage or financial institution. Not registered with the SEC, FINRA, or any state securities authority. Use at your own risk for educational purposes only.
          </p>
        </div>
      </main>
    </div>
  );
}
