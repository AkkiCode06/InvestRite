import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, ExternalLink, TrendingUp, TrendingDown, Bell, RefreshCw } from 'lucide-react';
import { api } from '../../utils/api.js';

const GREEN = '#00d4aa', RED = '#ff4d6d', PURPLE = '#7b39fc';

const TT_STYLE = { background: 'rgba(10,8,22,0.97)', border: '1px solid rgba(123,57,252,0.35)', borderRadius: 10, fontSize: 12, fontFamily: 'Cabin', color: '#fff' };

function timeAgo(s) {
  if (!s) return '';
  const sec = Math.floor((Date.now() - new Date(s).getTime()) / 1000);
  if (sec < 3600) return `${Math.max(1, Math.floor(sec / 60))}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

const RANGE_BTNS = [
  { key: '1d', label: '1D' }, { key: '5d', label: '5D' }, { key: '1mo', label: '1M' },
  { key: '6mo', label: '6M' }, { key: '1y', label: '1Y' }, { key: '5y', label: '5Y' }, { key: 'max', label: 'Max' },
];
function fmtTick(iso, range) {
  const d = new Date(iso);
  if (range === '1d') return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (range === '5d') return d.toLocaleDateString('en-US', { weekday: 'short' });
  if (range === '1mo' || range === '6mo') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (range === '1y') return d.toLocaleDateString('en-US', { month: 'short' });
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}
function fmtLabel(iso, range) {
  const d = new Date(iso);
  if (range === '1d' || range === '5d') return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function StockOverview({ ticker, onBack, onCreateAlert }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [range, setRange] = useState('6mo');
  const [chart, setChart] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true); setError(''); setData(null);
    api.stock(ticker)
      .then(d => { if (alive) setData(d); })
      .catch(e => { if (alive) setError(e.message || 'Failed to load'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [ticker]);

  useEffect(() => {
    let alive = true;
    setChartLoading(true);
    api.stockChart(ticker, range)
      .then(d => { if (alive) setChart(d.chart || []); })
      .catch(() => { if (alive) setChart([]); })
      .finally(() => { if (alive) setChartLoading(false); });
    return () => { alive = false; };
  }, [ticker, range]);

  const cur = data?.currency || 'USD';
  const inr = cur === 'INR';
  const sym = inr ? '₹' : '$';
  const money = (n, dec = 2) => n == null ? '—' : `${sym}${Number(n).toLocaleString(inr ? 'en-IN' : 'en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })}`;
  const mcap = (n) => {
    if (n == null) return '—';
    if (inr) { if (n >= 1e12) return `${sym}${(n / 1e12).toFixed(2)} L Cr`; if (n >= 1e7) return `${sym}${(n / 1e7).toFixed(0)} Cr`; if (n >= 1e5) return `${sym}${(n / 1e5).toFixed(2)} L`; return `${sym}${n.toFixed(0)}`; }
    if (n >= 1e12) return `${sym}${(n / 1e12).toFixed(2)}T`; if (n >= 1e9) return `${sym}${(n / 1e9).toFixed(2)}B`; if (n >= 1e6) return `${sym}${(n / 1e6).toFixed(2)}M`; return `${sym}${n.toFixed(0)}`;
  };

  const back = (
    <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontFamily: 'Manrope', fontSize: 13, marginBottom: 18 }}
      onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}>
      <ArrowLeft size={15} /> Back
    </button>
  );

  if (loading) {
    return <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>{back}
      <div style={{ padding: 60, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontFamily: 'Manrope', fontSize: 13 }}>
        <RefreshCw size={22} className="spin" style={{ marginBottom: 10 }} /><div>Loading {ticker}…</div>
      </div></div>;
  }
  if (error || !data) {
    return <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>{back}
      <div className="p-card" style={{ padding: 48, textAlign: 'center', fontFamily: 'Manrope', color: '#ff4d6d' }}>Couldn’t load {ticker}. {error}</div></div>;
  }

  const up = (data.changePct ?? 0) >= 0;
  const chartColor = (chart.length && chart[chart.length - 1].close >= chart[0].close) ? GREEN : RED;
  const labelEvery = Math.max(1, Math.floor(chart.length / 6));
  const rangeChange = (chart.length >= 2 && chart[0].close) ? ((chart[chart.length - 1].close - chart[0].close) / chart[0].close) * 100 : null;

  const stats = [
    ['Open', money(data.stats.open)],
    ['High', money(data.stats.high)],
    ['Low', money(data.stats.low)],
    ['Mkt cap', mcap(data.stats.marketCap)],
    ['P/E ratio', data.stats.peRatio != null ? data.stats.peRatio.toFixed(2) : '—'],
    ['52-wk high', money(data.stats.week52High)],
    ['Dividend', data.stats.dividendYield != null ? `${data.stats.dividendYield.toFixed(2)}%` : '—'],
    ['Qtrly Div Amt', data.stats.qtrlyDiv != null ? money(data.stats.qtrlyDiv) : '—'],
    ['52-wk low', money(data.stats.week52Low)],
    ['Volume', data.stats.volume != null ? Number(data.stats.volume).toLocaleString() : '—'],
    ['Prev close', money(data.stats.previousClose)],
  ];

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      {back}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 className="screen-h1" style={{ fontSize: 26 }}>{data.name}</h1>
            <span style={{ fontFamily: 'Manrope', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: data.market === 'IN' ? 'rgba(0,212,170,0.12)' : 'rgba(123,57,252,0.16)', color: data.market === 'IN' ? '#5eead4' : '#c4b5fd' }}>
              {data.market === 'IN' ? '🇮🇳 NSE/BSE' : '🇺🇸 US'}
            </span>
          </div>
          <p className="screen-sub">{data.ticker} · {data.exchange}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'Cabin', sans-serif", fontSize: 30, fontWeight: 700, color: '#fff' }}>{money(data.price)}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'Cabin', fontSize: 14, fontWeight: 600, color: up ? GREEN : RED }}>
            {up ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
            {money(data.change)} ({up ? '+' : ''}{(data.changePct ?? 0).toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* CTA row */}
      {onCreateAlert && (
        <div style={{ marginBottom: 16 }}>
          <button className="btn-ghost" onClick={() => onCreateAlert(data.ticker)} style={{ fontSize: 12 }}>
            <Bell size={13} /> Set a price alert
          </button>
        </div>
      )}

      {/* ── Chart + time-range selector ────────────────────────────────── */}
      <div className="p-card" style={{ padding: '18px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {RANGE_BTNS.map(r => {
              const on = range === r.key;
              return (
                <button key={r.key} onClick={() => setRange(r.key)}
                  style={{ padding: '5px 12px', borderRadius: 8, border: on ? '1px solid rgba(123,57,252,0.4)' : '1px solid transparent', cursor: 'pointer',
                    fontFamily: 'Manrope', fontSize: 11.5, fontWeight: 700, transition: 'all .15s',
                    background: on ? 'rgba(123,57,252,0.22)' : 'rgba(255,255,255,0.04)', color: on ? '#c4b5fd' : 'rgba(255,255,255,0.5)' }}
                  onMouseEnter={e => { if (!on) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                  onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}>
                  {r.label}
                </button>
              );
            })}
          </div>
          {rangeChange != null && (
            <span style={{ fontFamily: "'Cabin', sans-serif", fontSize: 13, fontWeight: 700, color: rangeChange >= 0 ? GREEN : RED }}>
              {rangeChange >= 0 ? '+' : ''}{rangeChange.toFixed(2)}% <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>· {RANGE_BTNS.find(r => r.key === range)?.label}</span>
            </span>
          )}
        </div>

        {chartLoading ? (
          <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
            <RefreshCw size={18} className="spin" />
          </div>
        ) : chart.length ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chart} margin={{ top: 4, right: 8, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="stkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chartColor} stopOpacity={0.32} />
                  <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: 'rgba(167,139,250,0.45)', fontSize: 9 }} axisLine={false} tickLine={false} interval={labelEvery} minTickGap={24}
                tickFormatter={(d) => fmtTick(d, range)} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: 'rgba(167,139,250,0.45)', fontSize: 9 }} axisLine={false} tickLine={false} width={52}
                tickFormatter={(v) => `${sym}${v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toFixed(0)}`} />
              <Tooltip contentStyle={TT_STYLE} labelStyle={{ color: 'rgba(255,255,255,0.5)' }} itemStyle={{ color: '#e9d5ff' }}
                formatter={(v) => [money(v), 'Close']} labelFormatter={(d) => fmtLabel(d, range)} />
              <Area type="monotone" dataKey="close" stroke={chartColor} strokeWidth={2} fill="url(#stkGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontFamily: 'Manrope', fontSize: 12 }}>No chart data for this range.</div>
        )}
      </div>

      {/* ── Stats grid ─────────────────────────────────────────────────── */}
      <div className="p-card" style={{ padding: '18px 20px', marginBottom: 16 }}>
        <div style={{ fontFamily: 'Manrope', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a78bfa', marginBottom: 14 }}>Key statistics</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px 24px' }}>
          {stats.map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 8 }}>
              <span style={{ fontFamily: 'Manrope', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{label}</span>
              <span style={{ fontFamily: "'Cabin', sans-serif", fontSize: 13.5, fontWeight: 600, color: 'rgba(255,255,255,0.92)' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── News ───────────────────────────────────────────────────────── */}
      <div className="p-card" style={{ padding: '18px 20px' }}>
        <div style={{ fontFamily: 'Manrope', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a78bfa', marginBottom: 12 }}>Latest news</div>
        {data.news?.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {data.news.map((n, i) => (
              <a key={i} href={n.link} target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', padding: '11px 12px', borderRadius: 10, textDecoration: 'none', transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(123,57,252,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontFamily: 'Manrope', fontSize: 13.5, fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.45 }}>{n.title}</span>
                  <ExternalLink size={13} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0, marginTop: 3 }} />
                </div>
                <div style={{ fontFamily: 'Manrope', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{n.source} · {timeAgo(n.pubDate)}</div>
              </a>
            ))}
          </div>
        ) : <div style={{ padding: 16, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontFamily: 'Manrope', fontSize: 12 }}>No recent news for {data.ticker}.</div>}
      </div>

      <p style={{ marginTop: 12, textAlign: 'center', fontSize: 10, fontFamily: 'Manrope', color: 'rgba(255,255,255,0.15)' }}>
        Live data from Yahoo Finance · educational only · not investment advice
      </p>
    </div>
  );
}
