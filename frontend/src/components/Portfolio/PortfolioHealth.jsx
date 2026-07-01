import { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { api } from '../../utils/api.js';
import { symbolForMarket } from '../../utils/format.js';
import { inferMarket } from '../../services/firestore.js';

const PURPLE  = '#7b39fc';
const PURPLE2 = '#a78bfa';
const GREEN   = '#00d4aa';

// Shared recharts tooltip style — white text on dark glass
const TT_STYLE = {
  background: 'rgba(10,8,22,0.97)',
  border: '1px solid rgba(123,57,252,0.35)',
  borderRadius: 10,
  fontSize: 12,
  fontFamily: 'Cabin',
  color: '#fff',
  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
};
const TT_ITEM  = { color: '#e9d5ff' };
const TT_LABEL = { color: 'rgba(255,255,255,0.45)', fontFamily: 'Manrope', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' };
const RED     = '#ff4d6d';
const MUTED   = 'rgba(255,255,255,0.25)';

// Palette for donut slices — all purple-family then muted
const PIE_COLORS = ['#7b39fc','#a78bfa','#c4b5fd','#5b21b6','#4c1d95','#6d28d9','#9333ea','#7c3aed','#8b5cf6','#ddd6fe'];

function fmt$(n, sym = '$') { if (!n) return `${sym}0`; if (Math.abs(n) >= 1e6) return `${sym}${(n/1e6).toFixed(1)}M`; if (Math.abs(n) >= 1e3) return `${sym}${(n/1e3).toFixed(0)}K`; return `${sym}${n.toFixed(0)}`; }
function fmtPct(n, dec=1) { if (n == null) return '—'; return `${n >= 0 ? '+' : ''}${Number(n).toFixed(dec)}%`; }

function MetricCard({ label, value, sub, accent, warn }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${warn ? 'rgba(255,77,109,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, padding: '16px 18px' }}>
      <div style={{ fontFamily: 'Manrope', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: warn ? '#ff4d6d' : MUTED, marginBottom: 7 }}>{label}</div>
      <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 400, color: accent || 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontFamily: 'Manrope', fontSize: 11, color: MUTED, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function SectionHead({ children }) {
  return (
    <div style={{ fontFamily: 'Manrope', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: PURPLE2, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 2, height: 12, background: PURPLE, borderRadius: 2 }} />
      {children}
    </div>
  );
}

const SECTOR_COLORS = {
  Technology: '#7b39fc', Healthcare: '#a78bfa', 'Financial Services': '#5b21b6',
  Energy: '#ffd166', 'Consumer Cyclical': '#00d4aa', 'Consumer Defensive': '#06b6d4',
  Industrials: '#818cf8', 'Communication Services': '#c4b5fd', 'Basic Materials': '#34d399',
  'Real Estate': '#f59e0b', Utilities: '#6ee7b7', Unknown: '#374151',
};

export default function PortfolioHealth({ positions }) {
  const [enriched, setEnriched]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    if (!positions.length) return;
    const tickers = [...new Set(positions.map(p => p.ticker))];
    setLoading(true);
    api.portfolioHealth.enrich(tickers)
      .then(d => { setEnriched(d.enriched || []); setLastUpdated(new Date()); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [positions.map(p => p.ticker).join(',')]);

  if (!positions.length) return null;

  // Portfolio currency follows the dominant market by cost basis (per-holding aware).
  const _mkt = (p) => p.market || inferMarket(p.ticker);
  const _basisBy = positions.reduce((a, p) => { const m = _mkt(p); a[m] = (a[m] || 0) + (p.shares || 0) * (p.avgCost || 0); return a; }, {});
  const baseMarket = (_basisBy.IN || 0) > (_basisBy.US || 0) ? 'IN' : 'US';
  const sym = symbolForMarket(baseMarket);

  // ── Derive metrics ─────────────────────────────────────────────────────────
  const priceMap = Object.fromEntries(enriched.map(e => [e.ticker, e]));

  const positionsEnriched = positions.map(p => {
    const q      = priceMap[p.ticker] || {};
    const cost   = (p.shares || 0) * (p.avgCost || 0);
    const curr   = (p.shares || 0) * (q.price || p.avgCost || 0);
    const pnl    = curr - cost;
    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
    return { ...p, ...q, cost, curr, pnl, pnlPct };
  });

  const totalCost  = positionsEnriched.reduce((s, p) => s + p.cost, 0);
  const totalCurr  = positionsEnriched.reduce((s, p) => s + p.curr, 0);
  const totalPnl   = totalCurr - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  // Allocation donut
  const allocData = positionsEnriched
    .filter(p => p.curr > 0)
    .sort((a, b) => b.curr - a.curr)
    .map(p => ({ name: p.ticker, value: parseFloat(((p.curr / totalCurr) * 100).toFixed(1)) }));

  // Sector exposure
  const sectorMap = {};
  positionsEnriched.forEach(p => {
    const s = p.sector || 'Unknown';
    sectorMap[s] = (sectorMap[s] || 0) + p.curr;
  });
  const sectorData = Object.entries(sectorMap)
    .map(([sector, val]) => ({ sector: sector.replace(' Services','').replace(' Cyclical','').replace(' Defensive',''), pct: parseFloat(((val / totalCurr) * 100).toFixed(1)) }))
    .sort((a, b) => b.pct - a.pct);

  // P&L per position
  const pnlData = positionsEnriched
    .sort((a, b) => b.pnl - a.pnl)
    .map(p => ({ ticker: p.ticker, pnl: parseFloat(p.pnl.toFixed(0)), pct: parseFloat(p.pnlPct.toFixed(1)) }));

  // Risk metrics — beta: weight-adjusted over positions that HAVE beta data
  // ETFs (VOO, QQQ, etc.) don't report beta; normalise weight over only those that do
  const betaPositions = positionsEnriched.filter(p => p.beta != null && p.curr > 0);
  const betaCoveredValue = betaPositions.reduce((s, p) => s + p.curr, 0);
  const portfolioBeta = betaPositions.length && betaCoveredValue > 0
    ? parseFloat(betaPositions.reduce((s, p) => s + p.beta * (p.curr / betaCoveredValue), 0).toFixed(2))
    : null;
  const betaCoverage = totalCurr > 0 ? Math.round((betaCoveredValue / totalCurr) * 100) : 0;

  // Concentration (Herfindahl index — lower is more diversified)
  const hhi = positionsEnriched.reduce((s, p) => s + Math.pow(p.curr / totalCurr, 2), 0);
  const concentrationScore = Math.min(100, Math.round(hhi * 100));
  const concentrationLabel = hhi > 0.4 ? 'High' : hhi > 0.25 ? 'Moderate' : 'Diversified';

  // Weighted day change %
  const dayChangePct = totalCurr > 0
    ? positionsEnriched.reduce((s, p) => s + (p.changePercent || 0) * (p.curr / totalCurr), 0)
    : null;

  // Max single position
  const topPosition = [...positionsEnriched].sort((a, b) => b.curr - a.curr)[0];
  const topPct = totalCurr > 0 ? (topPosition?.curr / totalCurr) * 100 : 0;
  const overly_concentrated = topPct > 40;

  // "X min ago" label
  function timeAgo(date) {
    if (!date) return null;
    const mins = Math.round((Date.now() - date.getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins === 1) return '1 min ago';
    return `${mins} min ago`;
  }

  // Estimated drawdown: weighted avg of (price - 52w low) / (52w high - 52w low)
  let maxDrawdown = null;
  const dDrawdowns = positionsEnriched.filter(p => p.week52High && p.week52Low && p.price);
  if (dDrawdowns.length) {
    const wd = dDrawdowns.reduce((s, p) => {
      const dd = ((p.week52High - p.price) / p.week52High) * 100;
      return s + dd * (p.curr / totalCurr);
    }, 0);
    maxDrawdown = parseFloat(wd.toFixed(1));
  }

  if (loading) {
    return (
      <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ animation: 'spin 1s linear infinite', color: PURPLE, fontSize: 20 }}>↻</div>
        <span style={{ fontFamily: 'Manrope', fontSize: 13, color: MUTED }}>Fetching current prices for health analysis…</span>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 24 }}>

      {/* ── Last updated stamp ─────────────────────────────────────────── */}
      {lastUpdated && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4aa', boxShadow: '0 0 6px #00d4aa' }} />
          <span style={{ fontFamily: 'Manrope', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
            Last updated {timeAgo(lastUpdated)} · Yahoo Finance · 5-min cache
          </span>
        </div>
      )}

      {/* ── 1. Summary metrics (no duplicates from the main stats row) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        <MetricCard label="Current Market Value" value={fmt$(totalCurr, sym)}
          sub={`vs ${fmt$(totalCost, sym)} cost basis`} />
        <MetricCard label="Unrealised P&L" value={fmt$(totalPnl, sym)} accent={totalPnl >= 0 ? GREEN : RED}
          sub={fmtPct(totalPnlPct) + ' total return'} />
        <MetricCard label="Today's Change"
          value={dayChangePct != null ? `${dayChangePct >= 0 ? '+' : ''}${dayChangePct.toFixed(2)}%` : '—'}
          accent={dayChangePct != null ? (dayChangePct >= 0 ? GREEN : RED) : undefined}
          sub="Weighted portfolio day move" />
        <MetricCard label="Concentration Risk" value={concentrationLabel} warn={overly_concentrated}
          sub={`Top hold: ${topPosition?.ticker} (${topPct.toFixed(0)}%)`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* ── 2. Allocation donut ───────────────────────────────────────── */}
        <div className="p-card" style={{ padding: '18px 20px' }}>
          <SectionHead>Asset Allocation</SectionHead>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 160, height: 160, flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={allocData} cx="50%" cy="50%" innerRadius={42} outerRadius={72} paddingAngle={2} dataKey="value">
                    {allocData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={TT_STYLE} itemStyle={TT_ITEM} labelStyle={TT_LABEL}
                    formatter={(v, n) => [`${v}%`, n]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: 160 }}>
              {allocData.slice(0, 8).map((d, i) => (
                <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontFamily: 'Cabin', fontSize: 12, fontWeight: 600, color: '#c4b5fd' }}>{d.name}</span>
                  </div>
                  <span style={{ fontFamily: 'Cabin', fontSize: 11, color: MUTED }}>{d.value}%</span>
                </div>
              ))}
              {allocData.length > 8 && <div style={{ fontFamily: 'Manrope', fontSize: 10, color: MUTED, paddingTop: 4 }}>+{allocData.length - 8} more</div>}
            </div>
          </div>
          {overly_concentrated && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(255,77,109,0.07)', border: '1px solid rgba(255,77,109,0.2)', borderRadius: 8, fontFamily: 'Manrope', fontSize: 11, color: '#ff4d6d' }}>
              ⚠ {topPosition?.ticker} makes up {topPct.toFixed(0)}% of your portfolio. Consider trimming to reduce concentration risk.
            </div>
          )}
        </div>

        {/* ── 3. Sector exposure ────────────────────────────────────────── */}
        <div className="p-card" style={{ padding: '18px 20px' }}>
          <SectionHead>Sector Exposure</SectionHead>
          {sectorData.length > 1 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={sectorData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fill: MUTED, fontSize: 9, fontFamily: 'Manrope' }} tickFormatter={v => `${v}%`} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="sector" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 10, fontFamily: 'Manrope' }} axisLine={false} tickLine={false} width={90} />
                <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.04)" />
                <Tooltip
                  contentStyle={TT_STYLE} itemStyle={TT_ITEM} labelStyle={TT_LABEL}
                  formatter={v => [`${v}%`, 'Weight']}
                />
                <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                  {sectorData.map((d, i) => <Cell key={i} fill={SECTOR_COLORS[d.sector] || PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, fontFamily: 'Manrope', fontSize: 12 }}>
              Add more positions to see sector breakdown
            </div>
          )}
        </div>
      </div>

      {/* ── 4. P&L per position ─────────────────────────────────────────── */}
      <div className="p-card" style={{ padding: '18px 20px', marginBottom: 16 }}>
        <SectionHead>Position P&L</SectionHead>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={pnlData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="ticker" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'Cabin', fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: MUTED, fontSize: 9, fontFamily: 'Manrope' }} axisLine={false} tickLine={false} tickFormatter={v => fmt$(v, sym)} width={52} />
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <Tooltip
              contentStyle={TT_STYLE} itemStyle={TT_ITEM} labelStyle={TT_LABEL}
              formatter={(v, _, { payload }) => [`${fmt$(v, sym)} (${payload.pct >= 0 ? '+' : ''}${payload.pct}%)`, 'P&L']}
            />
            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
              {pnlData.map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? GREEN : RED} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── 5. Risk metrics row ─────────────────────────────────────────── */}
      <div className="p-card" style={{ padding: '18px 20px' }}>
        <SectionHead>Risk Metrics</SectionHead>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            {
              label: 'Portfolio Beta',
              value: portfolioBeta != null ? `${portfolioBeta}×` : enriched.length ? '—' : '…',
              desc: portfolioBeta != null
                ? `${betaCoverage < 100 ? `${betaCoverage}% of holdings · ` : ''}${portfolioBeta > 1.2 ? 'Amplified market moves' : portfolioBeta < 0.8 ? 'Defensive positioning' : 'Tracks market closely'}`
                : enriched.length ? 'ETFs have no beta on Yahoo' : 'Fetching…',
              accent: portfolioBeta != null ? (portfolioBeta > 1.5 ? RED : portfolioBeta < 0.7 ? GREEN : PURPLE2) : MUTED,
            },
            {
              label: 'Drawdown Exposure',
              value: maxDrawdown != null ? `−${maxDrawdown.toFixed(1)}%` : '—',
              desc: 'Weighted avg distance from each position\'s 52-week high',
              accent: maxDrawdown != null ? (maxDrawdown > 40 ? RED : maxDrawdown > 20 ? '#ffd166' : GREEN) : MUTED,
            },
            {
              label: 'HHI Concentration',
              value: concentrationScore,
              desc: `${concentrationLabel}${hhi > 0.4 ? ' — consider trimming ' + topPosition?.ticker : ''}`,
              accent: hhi > 0.4 ? RED : hhi > 0.25 ? '#ffd166' : GREEN,
            },
            {
              label: 'Diversification',
              value: `${positions.length} holds`,
              desc: positions.length < 5 ? 'Under-diversified — aim for 8–15' : positions.length > 20 ? 'Well spread across names' : 'Moderate — room to add',
              accent: positions.length < 5 ? '#ffd166' : GREEN,
            },
          ].map(({ label, value, desc, accent }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '14px 16px' }}>
              <div style={{ fontFamily: 'Manrope', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: MUTED, marginBottom: 8 }}>{label}</div>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: accent, letterSpacing: '-0.02em', marginBottom: 6 }}>{value}</div>
              <div style={{ fontFamily: 'Manrope', fontSize: 11, color: MUTED, lineHeight: 1.4 }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* Rebalancing suggestions */}
        {(overly_concentrated || (portfolioBeta != null && portfolioBeta > 1.5) || positions.length < 5) && (
          <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(123,57,252,0.07)', border: '1px solid rgba(123,57,252,0.2)', borderRadius: 10 }}>
            <div style={{ fontFamily: 'Manrope', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: PURPLE2, marginBottom: 8 }}>Rebalancing Suggestions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {overly_concentrated && <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>• <strong style={{ color: '#ff4d6d' }}>{topPosition?.ticker}</strong> is {topPct.toFixed(0)}% of portfolio. Consider trimming to ≤20% to reduce single-name risk.</div>}
              {portfolioBeta != null && portfolioBeta > 1.5 && <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>• High beta ({portfolioBeta}×) — portfolio will amplify market swings. Consider adding lower-beta defensive names or fixed income.</div>}
              {positions.length < 5 && <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>• Only {positions.length} position{positions.length !== 1 ? 's' : ''} — consider diversifying across 8–15 names to reduce idiosyncratic risk.</div>}
            </div>
          </div>
        )}

        <p style={{ fontFamily: 'Manrope', fontSize: 10, color: 'rgba(255,255,255,0.18)', marginTop: 12, lineHeight: 1.5 }}>
          All metrics are estimates based on Yahoo Finance data. Beta, drawdown, and sector data may be incomplete or delayed. Not investment advice.
        </p>
      </div>
    </div>
  );
}
