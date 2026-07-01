import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis,
  ResponsiveContainer, Tooltip, ReferenceLine,
} from 'recharts';
import { api } from '../../utils/api.js';
import { useRegion } from '../../context/RegionContext.jsx';
import { currencySymbol } from '../../utils/format.js';
import Disclaimer from '../common/Disclaimer.jsx';

// ── Formatting helpers ────────────────────────────────────────────────────────
const fmt$ = (n, compact = false) => {
  const s = currencySymbol(); const inr = s === '₹';
  if (n == null) return '—';
  if (compact) {
    if (Math.abs(n) >= 1e9) return `${s}${(n / 1e9).toFixed(1)}B`;
    if (Math.abs(n) >= 1e6) return `${s}${(n / 1e6).toFixed(0)}M`;
    return `${s}${n.toFixed(0)}`;
  }
  return new Intl.NumberFormat(inr ? 'en-IN' : 'en-US', { style: 'currency', currency: inr ? 'INR' : 'USD', maximumFractionDigits: 0 }).format(n);
};
const fmtPct  = (n) => n == null ? '—' : `${(n * 100).toFixed(1)}%`;
const fmtNum  = (n, d = 1) => n == null ? '—' : n.toFixed(d);
const fmtB    = (n) => n == null ? '—' : `${currencySymbol()}${n.toFixed(2)}B`;
const fmtUp   = (n) => n == null ? '—' : `${n >= 0 ? '+' : ''}${(n * 100).toFixed(0)}%`;

// Purple-family palette for the 6 layers — each a distinct shade
const LAYER_PURPLES = {
  L1: '#7b39fc', // primary purple
  L2: '#a78bfa', // medium
  L3: '#c4b5fd', // light
  L4: '#6d28d9', // dark
  L5: '#9333ea', // vivid
  L6: '#5b21b6', // deep
};

// ── Layer metadata (for the criteria panels) ──────────────────────────────────
const LAYERS = {
  L1: {
    label: 'L1 · Valuation',
    color: LAYER_PURPLES.L1,
    criteria: [
      ['Price per share', '< $20 (5x) / < $10 (10x)'],
      ['Market Cap', '$50M – $2B (5x) / < $500M (10x)'],
      ['P/E (TTM)', '< 20x or revenue growth > 40%'],
      ['P/B Ratio', '< 3x (ideally < 1.5x)'],
      ['EV/EBITDA', '< 12x'],
      ['Price/Sales', '< 3x mature / < 8x high-growth'],
    ],
  },
  L2: {
    label: 'L2 · Growth',
    color: LAYER_PURPLES.L2,
    criteria: [
      ['Revenue Growth YoY', '≥ 20% (5x) / ≥ 40% (10x)'],
      ['EPS Trend', '3 consecutive improving quarters'],
      ['EPS Estimate Revision', 'Analysts revising up past 90 days'],
      ['TAM Expansion', 'Sector TAM growing > 15% annually'],
      ['Insider Buying', 'Net buying in last 6 months'],
      ['Relative Strength RSI', '40–70 (not extended, not broken)'],
    ],
  },
  L3: {
    label: 'L3 · Quality',
    color: LAYER_PURPLES.L3,
    criteria: [
      ['Gross Margin', '≥ 35% (software/biotech ≥ 60%)'],
      ['Operating Margin Trend', 'Expanding YoY'],
      ['Return on Equity', '> 12%'],
      ['ROIC', '> 10% — single most important long-term signal'],
      ['Free Cash Flow', 'Positive; if negative, runway > 24 months'],
      ['Piotroski F-Score', '≥ 6 out of 9'],
    ],
  },
  L4: {
    label: 'L4 · Balance Sheet',
    color: LAYER_PURPLES.L4,
    criteria: [
      ['Debt/Equity', '< 1.0x (ideally < 0.5x)'],
      ['Current Ratio', '> 1.5x'],
      ['Interest Coverage', '> 3x'],
      ['Cash Runway', '≥ 12 months operating expenses'],
      ['Goodwill / Total Assets', '< 30%'],
      ['Share Dilution YoY', '< 5% increase in share count'],
    ],
  },
  L5: {
    label: 'L5 · Yield Overlay',
    color: LAYER_PURPLES.L5,
    criteria: [
      ['Dividend Yield', '> 3.5%'],
      ['Payout Ratio', '< 65%'],
      ['Dividend Growth', '3+ consecutive years of increases'],
      ['Dividend Coverage', 'FCF covers dividend ≥ 1.5x'],
      ['Special Dividend History', 'Bonus signal of strong cash generation'],
    ],
  },
  L6: {
    label: 'L6 · Advanced Signals',
    color: LAYER_PURPLES.L6,
    criteria: [
      ['Short Interest', '< 15% of float'],
      ['Days to Cover', '< 5 days'],
      ['Revenue Concentration', 'No single customer > 30%'],
      ['R&D as % Revenue', '≥ 10% for tech/biotech'],
      ['Analyst Estimate Revision', 'EPS estimates revised up last 90 days'],
      ['Earnings Surprise History', '3+ consecutive EPS beats'],
    ],
  },
};

// ── Check pill ────────────────────────────────────────────────────────────────
function Check({ pass }) {
  if (pass === null || pass === undefined)
    return <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>N/A</span>;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700,
      color: pass ? '#a78bfa' : 'var(--accent-red)',
    }}>
      {pass ? '✓' : '✗'}
    </span>
  );
}

// ── Price chart ──────────────────────────────────────────────────────────────
function PriceChart({ chartState }) {
  if (!chartState) return null;
  if (chartState.loading)
    return <div style={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Loading chart…</div>;
  if (chartState.error || !chartState.prices?.length)
    return <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Chart unavailable</div>;

  const { prices, changePct } = chartState;
  const isUp = changePct >= 0;
  const color = isUp ? '#00d4aa' : '#ff4d6d';
  const minV  = Math.min(...prices.map((p) => p.close)) * 0.98;
  const maxV  = Math.max(...prices.map((p) => p.close)) * 1.02;

  // Show every ~20th label so it doesn't crowd
  const labelInterval = Math.max(1, Math.floor(prices.length / 5));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>6-Month Price</span>
        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>
          {isUp ? '▲' : '▼'} {isUp ? '+' : ''}{changePct}%
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          ${prices[0]?.close?.toFixed(2)} → ${prices[prices.length - 1]?.close?.toFixed(2)}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <AreaChart data={prices} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={`grad-${isUp ? 'up' : 'dn'}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone" dataKey="close"
            stroke={color} strokeWidth={1.5}
            fill={`url(#grad-${isUp ? 'up' : 'dn'})`}
            dot={false} activeDot={{ r: 3, fill: color }}
          />
          <XAxis
            dataKey="date"
            axisLine={false} tickLine={false} interval={labelInterval}
            tick={{ fill: 'rgba(167,139,250,0.4)', fontSize: 9 }}
          />
          <YAxis
            domain={[minV, maxV]} tick={{ fill: 'rgba(167,139,250,0.4)', fontSize: 9 }}
            axisLine={false} tickLine={false} width={42}
            tickFormatter={(v) => `${currencySymbol()}${v.toFixed(0)}`}
          />
          <Tooltip
            contentStyle={{ background: 'rgba(10,8,22,0.97)', border: '1px solid rgba(123,57,252,0.35)', borderRadius: 8, fontSize: 11, color: '#fff', fontFamily: 'Cabin' }}
            labelStyle={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Manrope', fontSize: 10 }}
            itemStyle={{ color: '#e9d5ff' }}
            formatter={(v) => [`${currencySymbol()}${v.toFixed(2)}`, 'Close']}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Score ring — purple shades only ──────────────────────────────────────────
function ScoreRing({ score }) {
  // High = bright purple, mid = medium, low = dim purple
  const ringColor  = score >= 75 ? '#7b39fc' : score >= 50 ? '#9333ea' : 'rgba(123,57,252,0.35)';
  const textColor  = score >= 75 ? '#c4b5fd' : score >= 50 ? '#a78bfa' : 'rgba(167,139,250,0.5)';
  const trackColor = 'rgba(123,57,252,0.10)';
  return (
    <div style={{
      width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
      background: `conic-gradient(${ringColor} ${score * 3.6}deg, ${trackColor} 0deg)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: score >= 75 ? '0 0 8px rgba(123,57,252,0.4)' : 'none',
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: '50%',
        background: 'rgba(10,8,20,0.9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700, color: textColor,
        fontFamily: 'Cabin, sans-serif',
      }}>
        {score}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MultiBaggerScreen() {
  const { region } = useRegion();
  const [mode, setMode]           = useState('5x');
  const [loading, setLoading]     = useState(false);
  const [data, setData]           = useState(null);
  const [error, setError]         = useState('');
  const [expanded, setExpanded]   = useState(null);
  const [openLayer, setOpenLayer] = useState(null);
  const [chartData, setChartData] = useState({});   // { [ticker]: { loading, prices, changePct, error } }

  async function handleRowClick(ticker) {
    if (expanded === ticker) { setExpanded(null); return; }
    setExpanded(ticker);
    if (!chartData[ticker]) {
      setChartData((prev) => ({ ...prev, [ticker]: { loading: true } }));
      try {
        const res = await api.multibagger.chart(ticker);
        setChartData((prev) => ({ ...prev, [ticker]: { ...res, loading: false } }));
      } catch {
        setChartData((prev) => ({ ...prev, [ticker]: { error: true, loading: false } }));
      }
    }
  }

  const runScreen = useCallback(async () => {
    setLoading(true);
    setError('');
    setData(null);
    setExpanded(null);
    setChartData({});
    try {
      const res = await api.multibagger.screen(mode, region);
      setData(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [mode, region]);

  // Clear stale results when the market region changes — re-run for the new market.
  useEffect(() => { setData(null); setExpanded(null); setError(''); }, [region]);

  const MODES = [
    { key: '5x',     label: '5× Candidate',   color: '#7b39fc' },
    { key: '10x',    label: '10× Candidate',   color: '#a78bfa' },
    { key: 'income', label: 'Income / Yield',  color: '#c4b5fd' },
  ];

  const activeMode = MODES.find((m) => m.key === mode);

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1300, margin: '0 auto' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div className="purple-glow">
          <h1 className="screen-h1" style={{ position: 'relative', zIndex: 1 }}>Multi-Bagger Screener</h1>
          <p className="screen-sub" style={{ position: 'relative', zIndex: 1 }}>6-layer formula · {region === 'IN' ? 'India (NSE) universe' : 'US equity universe'} · Live Yahoo Finance data</p>
        </div>
      </div>

      {/* ── Mode selector + Run ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <span className="sec-label" style={{ marginBottom: 0, marginRight: 6 }}>Mode:</span>
        {MODES.map((m) => (
          <button key={m.key} onClick={() => setMode(m.key)}
            style={{
              padding: '6px 16px', borderRadius: 9999, fontSize: 12, fontWeight: 600, fontFamily: 'Cabin',
              cursor: 'pointer', border: '1px solid', transition: 'all .15s',
              background: mode === m.key ? 'rgba(123,57,252,0.18)' : 'rgba(255,255,255,0.03)',
              color: mode === m.key ? '#c4b5fd' : 'rgba(255,255,255,0.45)',
              borderColor: mode === m.key ? 'rgba(123,57,252,0.35)' : 'rgba(255,255,255,0.07)',
            }}
          >{m.label}</button>
        ))}
        <button onClick={runScreen} disabled={loading} className="btn-purple" style={{ marginLeft: 'auto' }}>
          {loading ? <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>↻</span> Screening…</> : '▶ Run Screen'}
        </button>
      </div>

      {/* ── 6 Layer Criteria Panels ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        {Object.entries(LAYERS).map(([key, layer]) => (
          <div key={key} className="p-card">
            <button onClick={() => setOpenLayer(openLayer === key ? null : key)}
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <span style={{ fontFamily: 'Manrope', fontSize: 11, fontWeight: 700, color: layer.color, letterSpacing: '0.02em' }}>{layer.label}</span>
              <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>{openLayer === key ? '▲' : '▼'}</span>
            </button>
            {openLayer === key && (
              <div style={{ padding: '0 14px 12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {layer.criteria.map(([metric, threshold]) => (
                  <div key={metric} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 11 }}>
                    <span style={{ fontFamily: 'Manrope', color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>{metric}</span>
                    <span style={{ fontFamily: 'Cabin', color: 'rgba(255,255,255,0.25)', textAlign: 'right' }}>{threshold}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Thresholds quick-ref ────────────────────────────────────────── */}
      <div className="p-card mb-4" style={{ padding: '14px 16px', overflow: 'auto' }}>
        <div className="sec-label">Quick Reference Thresholds</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              {['Metric', '5× Candidate', '10× Candidate', 'Income / Yield'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '4px 10px', fontFamily: 'Manrope', color: 'rgba(255,255,255,0.3)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['Price',          '< $20',    '< $10',    'Any'],
              ['Market Cap',     '< $2B',    '< $500M',  'Any'],
              ['Rev Growth',     '> 20%',    '> 40%',    '> 5%'],
              ['Gross Margin',   '> 35%',    '> 50%',    '> 25%'],
              ['D/E Ratio',      '< 1.0×',   '< 0.5×',   '< 1.5×'],
              ['P/E',            '< 20×',    '< 15×',    '< 18×'],
              ['ROIC',           '> 10%',    '> 15%',    '> 8%'],
              ['Div Yield',      'Optional', 'Optional', '> 3.5%'],
              ['Piotroski Score','≥ 6',      '≥ 7',      '≥ 6'],
              ['Short Interest', '< 15%',    '< 10%',    '< 20%'],
            ].map(([m, a, b, c]) => (
              <tr key={m}>
                <td style={{ padding: '5px 10px', fontFamily: 'Manrope', fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{m}</td>
                <td style={{ padding: '5px 10px', color: '#7b39fc',  fontFamily: 'Cabin', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{a}</td>
                <td style={{ padding: '5px 10px', color: '#a78bfa',  fontFamily: 'Cabin', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{b}</td>
                <td style={{ padding: '5px 10px', color: '#c4b5fd',  fontFamily: 'Cabin', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{c}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div className="spin" style={{ fontSize: 28, display: 'inline-block', color: '#7b39fc' }}>↻</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 10, fontWeight: 600 }}>
            Running {activeMode?.label} screen…
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
            Fetching financials for ~60 small-cap stocks · Applying 6 filter layers
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
            First run takes ~30s · Results cached for 30 minutes
          </div>
        </div>
      )}

      {error && (
        <div style={{ color: 'var(--accent-red)', fontSize: 13, padding: 12, background: 'var(--accent-red-dim)', borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────────────── */}
      {data && !loading && (
        <>
          {/* Results header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontFamily: 'Manrope', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
              {data.count === 0 ? 'No stocks passed filters — try 5× mode.' : `${data.count} passed · click any row to expand`}
            </span>
            <span style={{ marginLeft: 'auto', fontFamily: 'Manrope', fontSize: 10, color: 'rgba(255,255,255,0.18)' }}>
              Yahoo Finance · not investment advice
            </span>
          </div>

          <div className="p-card overflow-hidden">
            <div style={{ overflowX: 'auto' }}>
              <table className="dt">
                <thead>
                  <tr>
                    <th style={{ width: 32, textAlign: 'center' }}>#</th>
                    <th style={{ width: 44 }}>Score</th>
                    <th>Ticker</th>
                    <th>Sector</th>
                    <th>Price</th>
                    <th>Mkt Cap</th>
                    <th>P/E</th>
                    <th>P/B</th>
                    <th>Rev Growth</th>
                    <th>Gross Margin</th>
                    <th>D/E</th>
                    <th>Piotroski</th>
                    <th>Div Yield</th>
                    <th>Target</th>
                    <th>Upside</th>
                    <th>Checks</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.length === 0 ? (
                    <tr>
                      <td colSpan={16} style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.2)', fontFamily: 'Manrope', fontSize: 13 }}>
                        No stocks passed. Try <strong style={{ color: '#a78bfa' }}>5× mode</strong> or expand a layer to review criteria.
                      </td>
                    </tr>
                  ) : (
                    data.results.map((r, i) => {
                      const isOpen = expanded === r.ticker;
                      return (
                        <React.Fragment key={r.ticker}>
                          <tr
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleRowClick(r.ticker)}
                          >
                            <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{i + 1}</td>
                            <td><ScoreRing score={r.score} /></td>
                            <td>
                              <div>
                                <div style={{ fontFamily: 'Cabin', fontWeight: 700, color: '#c4b5fd', fontSize: 13, letterSpacing: '0.02em' }}>{r.ticker}</div>
                                <div style={{ fontSize: 10, color: 'var(--text-muted)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                              </div>
                            </td>
                            <td style={{ fontSize: 11, color: 'var(--text-secondary)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.sector}</td>
                            <td className="mono" style={{ fontWeight: 600 }}>${r.price?.toFixed(2) ?? '—'}</td>
                            <td className="mono">{fmtB(r.marketCapB)}</td>
                            <td className="mono" style={{ color: r.pe != null && r.pe < 15 ? '#a78bfa' : 'rgba(255,255,255,0.55)' }}>{fmtNum(r.pe, 1)}</td>
                            <td className="mono" style={{ color: r.pb != null && r.pb < 1.5 ? '#a78bfa' : 'rgba(255,255,255,0.55)' }}>{fmtNum(r.pb, 1)}</td>
                            <td className="mono" style={{ color: r.revGrowth != null && r.revGrowth > 0.4 ? 'var(--accent-green)' : r.revGrowth != null && r.revGrowth > 0.2 ? 'var(--accent-yellow)' : 'var(--text-primary)' }}>
                              {fmtPct(r.revGrowth)}
                            </td>
                            <td className="mono" style={{ color: r.grossMargin != null && r.grossMargin > 0.5 ? '#a78bfa' : 'rgba(255,255,255,0.55)' }}>
                              {fmtPct(r.grossMargin)}
                            </td>
                            <td className="mono" style={{ color: r.deRatio != null && r.deRatio > 1 ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                              {r.deRatio != null ? `${r.deRatio.toFixed(2)}×` : '—'}
                            </td>
                            <td>
                              <span style={{
                                fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700,
                                color: r.piotroski >= 7 ? '#7b39fc' : r.piotroski >= 5 ? '#a78bfa' : 'rgba(167,139,250,0.4)',
                              }}>
                                {r.piotroski}/9
                              </span>
                            </td>
                            <td className="mono" style={{ color: r.divYield && r.divYield > 0.035 ? '#c4b5fd' : 'rgba(255,255,255,0.3)' }}>
                              {r.divYield ? fmtPct(r.divYield) : '—'}
                            </td>
                            <td className="mono">{r.targetPrice ? `${currencySymbol()}${r.targetPrice.toFixed(2)}` : '—'}</td>
                            <td className="mono" style={{ color: r.targetUpside != null && r.targetUpside > 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 700 }}>
                              {fmtUp(r.targetUpside)}
                            </td>
                            <td>
                              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                                {r.filtersPassed}/{r.filtersTotal} <span style={{ color: 'var(--text-muted)' }}>▼</span>
                              </span>
                            </td>
                          </tr>

                          {/* ── Expanded analysis row ───────────────────── */}
                          {isOpen && (
                            <tr key={`${r.ticker}-expanded`}>
                              <td colSpan={16} style={{ padding: 0, background: 'var(--bg-secondary)' }}>
                                <div style={{ padding: '14px 20px' }}>

                                  {/* ── Price chart ─────────────────────── */}
                                  <div style={{
                                    background: 'rgba(123,57,252,0.04)', border: '1px solid rgba(123,57,252,0.18)',
                                    borderRadius: 8, padding: '10px 14px', marginBottom: 12,
                                  }}>
                                    <PriceChart chartState={chartData[r.ticker]} />
                                  </div>

                                  {/* ── 3-panel analysis grid ───────────── */}
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, alignItems: 'start' }}>

                                  {/* Bull case */}
                                  <div style={{ background: 'var(--accent-green-dim)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: 8, padding: '9px 11px' }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                                      🟢 Bull — {mode === 'income' ? '2–3×' : mode === '10x' ? '10×' : '5×'} case
                                    </div>
                                    {r.bullCasePts?.map((pt, idx) => (
                                      <div key={idx} style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, paddingLeft: 7, borderLeft: '2px solid rgba(0,212,170,0.3)', lineHeight: 1.4 }}>
                                        {pt.split('. ')[0]}.
                                      </div>
                                    ))}
                                  </div>

                                  {/* Bear case */}
                                  <div style={{ background: 'var(--accent-red-dim)', border: '1px solid rgba(255,77,109,0.2)', borderRadius: 8, padding: '9px 11px' }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-red)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                                      🔴 Bear / red flags
                                    </div>
                                    {r.bearCasePts?.map((pt, idx) => (
                                      <div key={idx} style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, paddingLeft: 7, borderLeft: '2px solid rgba(255,77,109,0.3)', lineHeight: 1.4 }}>
                                        {pt.split('. ')[0]}.
                                      </div>
                                    ))}
                                  </div>

                                  {/* Filter breakdown */}
                                  <div style={{ background: 'rgba(123,57,252,0.04)', border: '1px solid rgba(123,57,252,0.15)', borderRadius: 8, padding: '10px 12px' }}>
                                    <div style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 7 }}>
                                      Filter Breakdown
                                    </div>
                                    {r.filterChecks && Object.entries(r.filterChecks).map(([key, val]) => {
                                      const layerKey = key.split('_')[0];
                                      const metric = key.split('_').slice(1).join(' ');
                                      const color = LAYERS[layerKey]?.color || 'var(--text-muted)';
                                      return (
                                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', borderBottom: '1px solid var(--border)', fontSize: 11 }}>
                                          <span style={{ color: 'var(--text-secondary)' }}>
                                            <span style={{ color, fontWeight: 700, marginRight: 4 }}>{layerKey}</span>
                                            {metric}
                                          </span>
                                          <Check pass={val} />
                                        </div>
                                      );
                                    })}
                                  </div>
                                  </div>{/* end 3-panel grid */}
                                </div>{/* end outer padding */}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
            {data.count} results · Ranked by composite score · Click any row to expand bull/bear analysis
          </div>
        </>
      )}

      {/* ── First-run prompt ────────────────────────────────────────────── */}
      {!data && !loading && !error && (
        <div style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Select a screening mode and run the screen</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 440, margin: '0 auto' }}>
            Applies all 6 filter layers across ~60 small-cap US stocks using live Yahoo Finance financial data.
          </div>
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <Disclaimer compact />
      </div>
    </div>
  );
}
