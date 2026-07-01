import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { api } from '../../utils/api.js';
import { getPortfolio, inferMarket } from '../../services/firestore.js';
import { useRegion } from '../../context/RegionContext.jsx';
import { currencySymbol, symbolForMarket, fmtMoneyForMarket } from '../../utils/format.js';
import { ExternalLink, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

const GREEN  = '#00d4aa';
const RED    = '#ff4d6d';
const PURPLE = '#7b39fc';

function fmt$(n) { const s = currencySymbol(); if (n == null) return '—'; if (Math.abs(n) >= 1e9) return `${s}${(n/1e9).toFixed(2)}B`; if (Math.abs(n) >= 1e3) return `${s}${(n/1e3).toFixed(2)}K`; return `${s}${n.toFixed(2)}`; }
function fmtPct(n) { if (n == null) return '—'; return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`; }
function timeAgo(d) {
  if (!d) return '';
  const mins = Math.round((Date.now() - new Date(d)) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs/24)}d ago`;
}

/* ── Ticker Tape ─────────────────────────────────────────────────────────── */
function TickerItem({ sym, price, changePct }) {
  const up = changePct >= 0;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 20px', borderRight: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
      <span style={{ fontFamily: 'Cabin', fontSize: 12, fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.03em' }}>{sym}</span>
      <span style={{ fontFamily: 'Cabin', fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>${price?.toFixed(2)}</span>
      <span style={{ fontFamily: 'Cabin', fontSize: 11, fontWeight: 600, color: up ? GREEN : RED }}>
        {up ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
      </span>
    </div>
  );
}

function TickerTape({ gainers = [], losers = [] }) {
  // Interleave green and red, then duplicate for seamless loop
  const combined = [];
  const len = Math.max(gainers.length, losers.length);
  for (let i = 0; i < len; i++) {
    if (gainers[i]) combined.push({ ...gainers[i], type: 'gain' });
    if (losers[i])  combined.push({ ...losers[i],  type: 'loss' });
  }
  if (!combined.length) return null;

  return (
    <div style={{
      width: '100%', overflow: 'hidden', height: 36,
      background: 'rgba(123,57,252,0.06)', borderBottom: '1px solid rgba(123,57,252,0.15)',
      display: 'flex', alignItems: 'center',
      position: 'relative', zIndex: 15, flexShrink: 0,
    }}>
      {/* Fade edges */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 40, background: 'linear-gradient(to right, rgba(8,4,16,1), transparent)', zIndex: 1, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, background: 'linear-gradient(to left, rgba(8,4,16,1), transparent)', zIndex: 1, pointerEvents: 'none' }} />

      <div className="ticker-track">
        {[...combined, ...combined].map((item, i) => (
          <TickerItem key={i} sym={item.symbol} price={item.price} changePct={item.changePct} />
        ))}
      </div>
    </div>
  );
}

/* ── Index card ──────────────────────────────────────────────────────────── */
function IndexCard({ label, price, changePct, currency }) {
  const up = changePct >= 0;
  const isRate = currency === null || label === '10Y Yield' || label === 'EUR/USD';
  return (
    <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontFamily: 'Manrope', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'Cabin', fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 4 }}>
        {isRate ? `${price?.toFixed(2)}${label === '10Y Yield' ? '%' : ''}` : `${currencySymbol()}${price?.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
      </div>
      <div style={{ fontFamily: 'Cabin', fontSize: 11, fontWeight: 600, color: up ? GREEN : RED }}>
        {up ? '▲' : '▼'} {Math.abs(changePct || 0).toFixed(2)}%
      </div>
    </div>
  );
}

/* ── News card ───────────────────────────────────────────────────────────── */
function NewsCard({ title, link, source, pubDate, summary }) {
  const SOURCE_COLORS = {
    'CNBC': '#0067c5', 'CNBC Markets': '#0067c5',
    'MarketWatch': '#7b39fc',
    'Yahoo Finance': '#720e9e', 'Yahoo Markets': '#720e9e',
  };
  const color = SOURCE_COLORS[source] || PURPLE;
  return (
    <a href={link} target="_blank" rel="noopener noreferrer"
      style={{ display: 'block', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', textDecoration: 'none', transition: 'background .15s' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(123,57,252,0.05)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: 'Cabin', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color, background: `${color}18`, border: `1px solid ${color}30`, borderRadius: 4, padding: '2px 7px' }}>{source}</span>
            <span style={{ fontFamily: 'Manrope', fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{timeAgo(pubDate)}</span>
          </div>
          <div style={{ fontFamily: 'Manrope', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.45, marginBottom: summary ? 4 : 0 }}>{title}</div>
          {summary && <div style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{summary}</div>}
        </div>
        <ExternalLink size={12} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0, marginTop: 2 }} />
      </div>
    </a>
  );
}

/* ── Skeleton loader ─────────────────────────────────────────────────────── */
function Skeleton({ h = 16, w = '100%', r = 6 }) {
  return <div style={{ height: h, width: w, borderRadius: r, background: 'rgba(255,255,255,0.06)', animation: 'pulse 1.4s ease infinite' }} />;
}

/* ── Main Dashboard ──────────────────────────────────────────────────────── */
export default function DashboardPage({ onNavigate }) {
  const { user } = useAuth();
  const { region } = useRegion();
  const [market, setMarket]     = useState(null);
  const [news, setNews]         = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [enriched, setEnriched]           = useState({});   // { ticker → { price, changePct } }
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [loadingNews, setLoadingNews]     = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [newsFilter, setNewsFilter]       = useState('All');
  const [showAllIndices, setShowAllIndices] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Load market + news on mount and whenever the market region changes
  useEffect(() => {
    setLoadingMarket(true); setLoadingNews(true);
    api.dashboard.market(region).then(d => { setMarket(d); setLoadingMarket(false); }).catch(() => setLoadingMarket(false));
    api.dashboard.news(region).then(d => { setNews(d.articles || []); setLoadingNews(false); }).catch(() => setLoadingNews(false));
  }, [region]);

  useEffect(() => {
    if (!user?.id) return;
    getPortfolio(user.id).then(positions => {
      setPortfolio(positions);
      // Also fetch live prices for the held tickers
      const tickers = [...new Set(positions.map(p => p.ticker))];
      if (!tickers.length) return;
      api.portfolioHealth.enrich(tickers).then(d => {
        const map = {};
        (d.enriched || []).forEach(e => { map[e.ticker] = e; });
        setEnriched(map);
      }).catch(() => {});
    }).catch(() => {});
  }, [user?.id]);

  async function loadAll() {
    if (user?.id) getPortfolio(user.id).then(setPortfolio).catch(() => {});
    api.dashboard.market(region).then(d => { setMarket(d); setLoadingMarket(false); }).catch(() => setLoadingMarket(false));
    api.dashboard.news(region).then(d => { setNews(d.articles || []); setLoadingNews(false); }).catch(() => setLoadingNews(false));
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadAll();
    setTimeout(() => setRefreshing(false), 1000);
  }

  // Portfolio quick stats — use live prices where available
  const positionsEnriched = portfolio.map(p => {
    const q      = enriched[p.ticker] || {};
    const cost   = (p.shares||0) * (p.avgCost||0);
    const curr   = q.price ? (p.shares||0) * q.price : cost;
    const pnl    = curr - cost;
    const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
    return { ...p, currentPrice: q.price, curr, cost, pnl, pnlPct, changePercent: q.changePercent };
  });
  const totalCost  = positionsEnriched.reduce((s, p) => s + p.cost, 0);
  const totalCurr  = positionsEnriched.reduce((s, p) => s + p.curr, 0);
  const totalPnl   = totalCurr - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
  const hasLivePrices = Object.keys(enriched).length > 0;

  // News filtering
  const sources = ['All', ...new Set(news.map(n => n.source))];
  const visibleNews = newsFilter === 'All' ? news : news.filter(n => n.source === newsFilter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Ticker tape ────────────────────────────────────────────────── */}
      {market && <TickerTape gainers={market.gainers} losers={market.losers} />}

      {/* ── Main scroll area ───────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 28px' }}>

        {/* ── Greeting row ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 28, fontWeight: 400, color: '#fff', letterSpacing: '-0.02em', marginBottom: 4 }}>
              {greeting}, {(user?.name || '').split(' ')[0] || 'there'} 👋
            </h1>
            <p style={{ fontFamily: 'Manrope', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              {market?.updatedAt && <span> · Market data as of {timeAgo(market.updatedAt)}</span>}
            </p>
          </div>
          <button onClick={handleRefresh} className="btn-ghost" style={{ fontSize: 12, gap: 6 }}>
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {/* ── Market indices ───────────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontFamily: 'Manrope', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 2, height: 12, background: PURPLE, borderRadius: 2 }} /> Market Overview
            </div>
            {!loadingMarket && (market?.indices || []).length > 4 && (
              <button
                onClick={() => setShowAllIndices(v => !v)}
                style={{
                  fontFamily: 'Manrope', fontSize: 11, fontWeight: 600,
                  color: '#a78bfa', background: 'rgba(123,57,252,0.1)',
                  border: '1px solid rgba(123,57,252,0.25)', borderRadius: 7,
                  padding: '4px 10px', cursor: 'pointer', transition: 'all .15s',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                {showAllIndices ? '▲ Less' : `▼ +${(market?.indices || []).length - 4} more`}
              </button>
            )}
          </div>

          {loadingMarket ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {[1,2,3,4].map(i => <Skeleton key={i} h={88} w="100%" r={12} />)}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {(market?.indices || [])
                .slice(0, showAllIndices ? undefined : 4)
                .map(idx => <IndexCard key={idx.symbol} {...idx} />)
              }
            </div>
          )}
        </div>

        {/* ── Two-column: Gainers/Losers + Portfolio ───────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

          {/* Biggest movers */}
          <div className="p-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['Gainers', 'Losers'].map(tab => (
                <button key={tab} id={`mover-${tab}`}
                  onClick={() => { document.getElementById('mover-Gainers').dataset.active = tab === 'Gainers'; document.getElementById('mover-Losers').dataset.active = tab === 'Losers'; document.getElementById(`panel-${tab}`).style.display = 'block'; document.getElementById(`panel-${tab === 'Gainers' ? 'Losers' : 'Gainers'}`).style.display = 'none'; }}
                  style={{ flex: 1, padding: '11px', fontFamily: 'Manrope', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', background: 'none', border: 'none', cursor: 'pointer', color: tab === 'Gainers' ? GREEN : RED, borderBottom: `2px solid ${tab === 'Gainers' ? GREEN : 'transparent'}` }}
                >
                  {tab === 'Gainers' ? '▲' : '▼'} {tab}
                </button>
              ))}
            </div>

            {/* Gainers panel */}
            <div id="panel-Gainers" style={{ padding: '8px 0' }}>
              {loadingMarket ? [1,2,3,4,5].map(i => (
                <div key={i} style={{ padding: '8px 16px', display: 'flex', gap: 8 }}>
                  <Skeleton h={12} w={40} /><Skeleton h={12} w={60} /><Skeleton h={12} w={40} />
                </div>
              )) : (market?.gainers || []).slice(0, 8).map(s => (
                <div key={s.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,170,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <span style={{ fontFamily: 'Cabin', fontSize: 13, fontWeight: 700, color: '#c4b5fd' }}>{s.symbol}</span>
                    <span style={{ fontFamily: 'Manrope', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>{s.name?.split(' ')[0]}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Cabin', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>${s.price?.toFixed(2)}</div>
                    <div style={{ fontFamily: 'Cabin', fontSize: 11, fontWeight: 700, color: GREEN }}>+{s.changePct?.toFixed(2)}%</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Losers panel */}
            <div id="panel-Losers" style={{ padding: '8px 0', display: 'none' }}>
              {loadingMarket ? [1,2,3,4,5].map(i => (
                <div key={i} style={{ padding: '8px 16px', display: 'flex', gap: 8 }}>
                  <Skeleton h={12} w={40} /><Skeleton h={12} w={60} /><Skeleton h={12} w={40} />
                </div>
              )) : (market?.losers || []).slice(0, 8).map(s => (
                <div key={s.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,77,109,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <span style={{ fontFamily: 'Cabin', fontSize: 13, fontWeight: 700, color: '#c4b5fd' }}>{s.symbol}</span>
                    <span style={{ fontFamily: 'Manrope', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>{s.name?.split(' ')[0]}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Cabin', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>${s.price?.toFixed(2)}</div>
                    <div style={{ fontFamily: 'Cabin', fontSize: 11, fontWeight: 700, color: RED }}>{s.changePct?.toFixed(2)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Portfolio snapshot */}
          <div className="p-card" style={{ padding: '18px 20px' }}>
            <div style={{ fontFamily: 'Manrope', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a78bfa', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 2, height: 12, background: PURPLE, borderRadius: 2 }} /> Your Portfolio
              {hasLivePrices && <span style={{ fontFamily: 'Manrope', fontSize: 9, color: 'rgba(0,212,170,0.7)', marginLeft: 4 }}>● live</span>}
            </div>
            {portfolio.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>💼</div>
                <p style={{ fontFamily: 'Manrope', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>No positions yet</p>
                <button className="btn-purple" style={{ fontSize: 12 }} onClick={() => onNavigate('portfolio')}>
                  Add your first position →
                </button>
              </div>
            ) : (
              <>
                {/* Summary stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                  {[
                    { label: 'Positions', value: portfolio.length, color: '#fff' },
                    { label: hasLivePrices ? 'Mkt Value' : 'Cost Basis', value: fmt$(hasLivePrices ? totalCurr : totalCost), color: '#fff' },
                    { label: 'Total P&L', value: hasLivePrices ? `${totalPnl >= 0 ? '+' : ''}${fmt$(totalPnl)}` : '—', color: hasLivePrices ? (totalPnl >= 0 ? GREEN : RED) : 'rgba(255,255,255,0.3)' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.025)', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontFamily: 'Manrope', fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
                      <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18, color, letterSpacing: '-0.02em' }}>{value}</div>
                      {label === 'Total P&L' && hasLivePrices && (
                        <div style={{ fontFamily: 'Cabin', fontSize: 9, color: totalPnl >= 0 ? GREEN : RED, marginTop: 2 }}>
                          {totalPnlPct >= 0 ? '+' : ''}{totalPnlPct.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 14 }}>
                  {positionsEnriched.slice(0, 6).map(p => {
                    const weight = totalCurr > 0 ? (p.curr / totalCurr) * 100 : 0;
                    const dayChg = p.changePercent;
                    return (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: 'Cabin', fontSize: 13, fontWeight: 700, color: '#c4b5fd' }}>{p.ticker}</span>
                          {dayChg != null && (
                            <span style={{ fontFamily: 'Cabin', fontSize: 10, fontWeight: 600, color: dayChg >= 0 ? GREEN : RED }}>
                              {dayChg >= 0 ? '▲' : '▼'}{Math.abs(dayChg).toFixed(2)}%
                            </span>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'Cabin', fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>
                            {(() => { const m = p.market || inferMarket(p.ticker); const v = hasLivePrices && p.currentPrice ? p.currentPrice : (p.avgCost || 0); return `${symbolForMarket(m)}${v.toFixed(2)}`; })()}
                          </div>
                          <div style={{ fontFamily: 'Cabin', fontSize: 10, color: hasLivePrices && p.pnl !== 0 ? (p.pnl >= 0 ? GREEN : RED) : 'rgba(255,255,255,0.25)' }}>
                            {hasLivePrices ? `${p.pnl >= 0 ? '+' : ''}${fmtMoneyForMarket(p.market || inferMarket(p.ticker), p.pnl, true)} (${p.pnlPct.toFixed(1)}%)` : `${weight.toFixed(1)}% weight`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {portfolio.length > 6 && <p style={{ fontFamily: 'Manrope', fontSize: 11, color: 'rgba(255,255,255,0.25)', paddingTop: 6 }}>+{portfolio.length - 6} more positions</p>}
                </div>
                <button className="btn-ghost" style={{ fontSize: 12, width: '100%', justifyContent: 'center' }} onClick={() => onNavigate('portfolio')}>
                  View full portfolio & health →
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── News feed ────────────────────────────────────────────────── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: 'Manrope', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 2, height: 12, background: PURPLE, borderRadius: 2 }} /> Market News
            </div>
            {/* Source filter chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {sources.map(s => (
                <button key={s} onClick={() => setNewsFilter(s)}
                  style={{
                    fontFamily: 'Manrope', fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 9999, border: '1px solid', cursor: 'pointer',
                    background: newsFilter === s ? 'rgba(123,57,252,0.18)' : 'rgba(255,255,255,0.04)',
                    color: newsFilter === s ? '#c4b5fd' : 'rgba(255,255,255,0.4)',
                    borderColor: newsFilter === s ? 'rgba(123,57,252,0.35)' : 'rgba(255,255,255,0.07)',
                  }}
                >{s}</button>
              ))}
            </div>
            {!loadingNews && <span style={{ marginLeft: 'auto', fontFamily: 'Manrope', fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{visibleNews.length} articles</span>}
          </div>

          <div className="p-card" style={{ padding: 0, overflow: 'hidden' }}>
            {loadingNews ? (
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3,4,5].map(i => (
                  <div key={i}>
                    <Skeleton h={10} w={80} r={4} />
                    <div style={{ marginTop: 6 }}><Skeleton h={14} w="90%" r={4} /></div>
                    <div style={{ marginTop: 4 }}><Skeleton h={10} w="60%" r={4} /></div>
                  </div>
                ))}
              </div>
            ) : visibleNews.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontFamily: 'Manrope', fontSize: 13 }}>
                No news available right now — try refreshing
              </div>
            ) : (
              visibleNews.map((article, i) => (
                <NewsCard key={i} {...article} />
              ))
            )}
          </div>
          <p style={{ fontFamily: 'Manrope', fontSize: 10, color: 'rgba(255,255,255,0.18)', marginTop: 10, textAlign: 'right' }}>
            News from Yahoo Finance, CNBC, MarketWatch · Educational only · Not investment advice
          </p>
        </div>
      </div>{/* end maxWidth wrapper */}
      </div>{/* end scroll area */}
    </div>
  );
}
