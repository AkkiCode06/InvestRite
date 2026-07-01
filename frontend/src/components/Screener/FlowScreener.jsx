import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../utils/api.js';
import { fmtDollar, fmtPct, fmtMCap, fmtNumber, daysUntil } from '../../utils/format.js';
import { useRegion } from '../../context/RegionContext.jsx';
import FilterChip from './FilterChip.jsx';

// RECOMMENDED thresholds shown in chips — only enforced once user edits a chip
const RECOMMENDED = {
  marketCapMin: 1, marketCapMax: 10,
  minPremium: 30,
  ivRank: 80,
  bullFlow: 70,
  volOI: 0.5,
  dteMin: 15, dteMax: 60,
};

// Active filter starts fully open — chips are informational until edited
const DEFAULT_FILTERS = {
  marketCapMin: 0,   marketCapMax: 999,
  minPremium: 0,
  ivRank: 0,
  bullFlow: 0,
  volOI: 10,
  dteMin: 0,         dteMax: 999,
};

function SortArrow({ field, sortBy, dir }) {
  if (sortBy !== field) return <span style={{ opacity: 0.25, fontSize: 9 }}>↕</span>;
  return <span style={{ color: '#7b39fc', fontSize: 9 }}>{dir === 'asc' ? '↑' : '↓'}</span>;
}

export default function FlowScreener({ sessionSeed, onSelectTicker }) {
  const { region, setRegion } = useRegion();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('bullishFlowPct');
  const [sortDir, setSortDir] = useState('desc');
  const [showOnlyPassing, setShowOnlyPassing] = useState(false);
  const [filterCatalyst, setFilterCatalyst] = useState(false);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  function setFilter(key, val) {
    setFilters(prev => ({ ...prev, [key]: val }));
  }

  const load = useCallback(() => {
    if (region === 'IN') { setData(null); setError(''); setLoading(false); return; } // no NSE options on Yahoo
    setLoading(true); setError('');
    api.screener.flow(sessionSeed, region)
      .then(setData).catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [sessionSeed, region]);

  useEffect(() => { load(); }, [load]);

  function handleSort(field) {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('desc'); }
  }

  const rows = data?.results || [];
  const filtered = rows
    .filter(r => !filterCatalyst || !r.hasNearCatalyst)
    .filter(r => r.marketCap >= filters.marketCapMin && r.marketCap <= filters.marketCapMax)
    .filter(r => !r.largestOrder || r.largestOrder >= filters.minPremium * 1000)
    .filter(r => r.ivRank == null || r.ivRank >= filters.ivRank)
    .filter(r => r.bullishFlowPct >= filters.bullFlow)
    .filter(r => r.volOI === 0 || r.volOI <= filters.volOI)
    .filter(r => r.dte >= filters.dteMin && r.dte <= filters.dteMax)
    .filter(r => !showOnlyPassing || r.passesFilter);
  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return ((a[sortBy] ?? 0) < (b[sortBy] ?? 0) ? -1 : 1) * dir;
  });
  const passingCount = rows.filter(r => r.passesFilter).length;
  const totalBullPremium = rows.reduce((s, r) => s + (r.bullishPremium || 0), 0);
  const avgBullPct = rows.length ? rows.reduce((s, r) => s + (r.bullishFlowPct || 0), 0) / rows.length : 0;

  if (region === 'IN') {
    return (
      <div style={{ padding: '24px 28px', maxWidth: 1340, margin: '0 auto' }}>
        <div className="purple-glow" style={{ marginBottom: 20 }}>
          <h1 className="screen-h1" style={{ position: 'relative', zIndex: 1 }}>Institutional Flow Screener</h1>
          <p className="screen-sub" style={{ position: 'relative', zIndex: 1 }}>Options flow · India (NSE)</p>
        </div>
        <div className="p-card" style={{ padding: '44px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 34, marginBottom: 14 }}>🇮🇳</div>
          <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: 'rgba(255,255,255,0.85)', marginBottom: 10 }}>Options flow isn't available for Indian markets</p>
          <p style={{ fontFamily: 'Manrope', fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, maxWidth: 540, margin: '0 auto 18px' }}>
            Our free data source (Yahoo Finance) doesn't provide NSE/BSE options chains, so the institutional options-flow screen only works for US equities. For Indian stocks, use the fundamental <strong style={{ color: '#c4b5fd' }}>Multi-Bagger</strong> screener — it fully supports the NSE universe.
          </p>
          <button className="btn-purple" onClick={() => setRegion('US')}>Switch to US markets</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1340, margin: '0 auto' }}>

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, position: 'relative' }}>
        <div className="purple-glow">
          <h1 className="screen-h1" style={{ position: 'relative', zIndex: 1 }}>Institutional Flow Screener</h1>
          <p className="screen-sub" style={{ position: 'relative', zIndex: 1 }}>US mid-cap equities · Options flow · Ranked by bullish %</p>
        </div>
        <button className="btn-ghost" onClick={load} disabled={loading} style={{ marginTop: 4 }}>
          <span style={loading ? { display: 'inline-block', animation: 'spin 1s linear infinite' } : {}}>↻</span>
          Refresh
        </button>
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      {data && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
          {[
            { label: 'Tickers Scanned',    value: data.count || 0,                      suffix: '' },
            { label: 'Pass All Criteria',  value: passingCount,                           suffix: '', accent: passingCount > 0 },
            { label: 'Total Bull Premium', value: fmtDollar(totalBullPremium, true),      suffix: '' },
            { label: 'Avg Bullish Flow',   value: fmtPct(avgBullPct),                    suffix: '' },
          ].map(({ label, value, accent }) => (
            <div key={label} className="stat-card">
              <div className="sec-label" style={{ marginBottom: 6 }}>{label}</div>
              <div style={{
                fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 400,
                color: accent ? '#a78bfa' : 'rgba(255,255,255,0.9)', letterSpacing: '-0.02em',
              }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div className="p-card" style={{ padding: '12px 16px', marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center' }}>
        <FilterChip filterKey="marketCapMin" label="MCap Min"
          displayValue={filters.marketCapMin === DEFAULT_FILTERS.marketCapMin ? `$${RECOMMENDED.marketCapMin}B` : `$${filters.marketCapMin}B`}
          value={filters.marketCapMin} defaultValue={DEFAULT_FILTERS.marketCapMin} onChange={setFilter} />
        <FilterChip filterKey="marketCapMax" label="MCap Max"
          displayValue={filters.marketCapMax === DEFAULT_FILTERS.marketCapMax ? `$${RECOMMENDED.marketCapMax}B` : `$${filters.marketCapMax}B`}
          value={filters.marketCapMax} defaultValue={DEFAULT_FILTERS.marketCapMax} onChange={setFilter} />
        <FilterChip filterKey="minPremium" label="Min Order"
          displayValue={filters.minPremium === DEFAULT_FILTERS.minPremium ? `$${RECOMMENDED.minPremium}K` : `$${filters.minPremium}K`}
          value={filters.minPremium} defaultValue={DEFAULT_FILTERS.minPremium} onChange={setFilter} />
        <FilterChip filterKey="ivRank" label="IV Rank"
          displayValue={filters.ivRank === DEFAULT_FILTERS.ivRank ? `≥${RECOMMENDED.ivRank}%` : `≥${filters.ivRank}%`}
          value={filters.ivRank} defaultValue={DEFAULT_FILTERS.ivRank} onChange={setFilter} />
        <FilterChip filterKey="bullFlow" label="Bull Flow"
          displayValue={filters.bullFlow === DEFAULT_FILTERS.bullFlow ? `≥${RECOMMENDED.bullFlow}%` : `≥${filters.bullFlow}%`}
          value={filters.bullFlow} defaultValue={DEFAULT_FILTERS.bullFlow} onChange={setFilter} />
        <FilterChip filterKey="volOI" label="Vol/OI"
          displayValue={filters.volOI === DEFAULT_FILTERS.volOI ? `<${RECOMMENDED.volOI}` : `<${filters.volOI}`}
          value={filters.volOI} defaultValue={DEFAULT_FILTERS.volOI} onChange={setFilter} />
        <FilterChip filterKey="dteMin" label="DTE Min"
          displayValue={filters.dteMin === DEFAULT_FILTERS.dteMin ? `${RECOMMENDED.dteMin}d` : `${filters.dteMin}d`}
          value={filters.dteMin} defaultValue={DEFAULT_FILTERS.dteMin} onChange={setFilter} />
        <FilterChip filterKey="dteMax" label="DTE Max"
          displayValue={filters.dteMax === DEFAULT_FILTERS.dteMax ? `${RECOMMENDED.dteMax}d` : `${filters.dteMax}d`}
          value={filters.dteMax} defaultValue={DEFAULT_FILTERS.dteMax} onChange={setFilter} />

        <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.08)', margin: '0 4px' }} />

        <label
          className="filter-pill-check"
          style={{
            background: showOnlyPassing ? 'rgba(123,57,252,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${showOnlyPassing ? 'rgba(123,57,252,0.35)' : 'rgba(255,255,255,0.08)'}`,
            color: showOnlyPassing ? '#c4b5fd' : 'rgba(255,255,255,0.45)',
          }}
        >
          <input type="checkbox" checked={showOnlyPassing} onChange={e => setShowOnlyPassing(e.target.checked)}
            style={{ width: 11, height: 11, accentColor: '#7b39fc' }} />
          All criteria {passingCount > 0 ? `(${passingCount})` : '(0)'}
        </label>

        <label
          className="filter-pill-check"
          style={{
            background: filterCatalyst ? 'rgba(255,77,109,0.10)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${filterCatalyst ? 'rgba(255,77,109,0.3)' : 'rgba(255,255,255,0.08)'}`,
            color: filterCatalyst ? '#ff4d6d' : 'rgba(255,255,255,0.45)',
          }}
        >
          <input type="checkbox" checked={filterCatalyst} onChange={e => setFilterCatalyst(e.target.checked)}
            style={{ width: 11, height: 11, accentColor: '#ff4d6d' }} />
          No catalysts
        </label>

        <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'Manrope', color: 'rgba(255,255,255,0.2)', alignSelf: 'center' }}>
          Yahoo Finance · not investment advice
        </span>
      </div>

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 14, background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.2)', color: '#ff4d6d', fontSize: 12, fontFamily: 'Manrope' }}>
          {error}
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="p-card">
        {loading ? (
          <div style={{ padding: 56, textAlign: 'center' }}>
            <div style={{ fontSize: 26, display: 'inline-block', animation: 'spin 1s linear infinite', color: '#7b39fc' }}>↻</div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginTop: 10, fontFamily: 'Manrope' }}>Screening institutional flow…</p>
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13, fontFamily: 'Manrope' }}>
            No results match current filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="dt">
              <thead>
                <tr>
                  <th style={{ width: 32, textAlign: 'center' }}>#</th>
                  <th onClick={() => handleSort('ticker')}>Ticker <SortArrow field="ticker" sortBy={sortBy} dir={sortDir} /></th>
                  <th onClick={() => handleSort('marketCap')}>Mkt Cap <SortArrow field="marketCap" sortBy={sortBy} dir={sortDir} /></th>
                  <th onClick={() => handleSort('bullishPremium')}>Bull Prem <SortArrow field="bullishPremium" sortBy={sortBy} dir={sortDir} /></th>
                  <th onClick={() => handleSort('bearishPremium')}>Bear Prem <SortArrow field="bearishPremium" sortBy={sortBy} dir={sortDir} /></th>
                  <th onClick={() => handleSort('bullishFlowPct')}>Flow % <SortArrow field="bullishFlowPct" sortBy={sortBy} dir={sortDir} /></th>
                  <th onClick={() => handleSort('ivRank')}>IV Rank <SortArrow field="ivRank" sortBy={sortBy} dir={sortDir} /></th>
                  <th onClick={() => handleSort('largestOrder')}>Largest Order <SortArrow field="largestOrder" sortBy={sortBy} dir={sortDir} /></th>
                  <th onClick={() => handleSort('volOI')}>Vol/OI <SortArrow field="volOI" sortBy={sortBy} dir={sortDir} /></th>
                  <th onClick={() => handleSort('dte')}>DTE <SortArrow field="dte" sortBy={sortBy} dir={sortDir} /></th>
                  <th>Flags</th>
                  <th>Screen</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, i) => {
                  const bullPct = row.bullishFlowPct || 0;
                  const armed = row.passesFilter;
                  return (
                    <tr key={row.ticker} style={{ opacity: row.hasNearCatalyst ? 0.55 : 1 }}>
                      <td style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 11, fontFamily: 'Manrope' }}>{i + 1}</td>
                      <td>
                        <div className="ticker-sym">{row.ticker}</div>
                        <div className="ticker-name" style={{ maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</div>
                      </td>
                      <td><span className="tv">{fmtMCap(row.marketCap)}</span></td>
                      <td><span className="tv tv-green">{fmtDollar(row.bullishPremium, true)}</span></td>
                      <td><span className="tv tv-red">{fmtDollar(row.bearishPremium, true)}</span></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ minWidth: 70 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                              <span style={{ fontSize: 11, fontFamily: 'Cabin', fontWeight: 600, color: '#00d4aa' }}>{bullPct.toFixed(1)}%</span>
                              <span style={{ fontSize: 10, fontFamily: 'Manrope', color: 'rgba(255,255,255,0.25)' }}>{(100 - bullPct).toFixed(1)}%</span>
                            </div>
                            <div className="flow-bar">
                              <div className="flow-bull" style={{ width: `${bullPct}%` }} />
                              <div className="flow-bear" />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{
                          fontFamily: 'Cabin', fontSize: 12, fontWeight: 600,
                          color: row.ivRank >= 90 ? '#ff4d6d' : row.ivRank >= 80 ? '#ffd166' : 'rgba(255,255,255,0.55)',
                        }}>
                          {fmtPct(row.ivRank)}
                        </span>
                      </td>
                      <td><span className="tv">{fmtDollar(row.largestOrder, true)}</span></td>
                      <td>
                        <span style={{ fontFamily: 'Cabin', fontSize: 11, color: row.volOI < 0.3 ? '#00d4aa' : 'rgba(255,255,255,0.5)' }}>
                          {fmtNumber(row.volOI)}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'Cabin', fontSize: 11, fontWeight: 600, color: '#c4b5fd', background: 'rgba(123,57,252,0.15)', padding: '2px 8px', borderRadius: 5, border: '1px solid rgba(123,57,252,0.25)' }}>
                          {row.dte}d
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', minWidth: 50 }}>
                          {row.earningsDate && daysUntil(row.earningsDate) <= 7 && (
                            <span style={{ fontSize: 9, fontFamily: 'Cabin', fontWeight: 700, color: '#ff4d6d', background: 'rgba(255,77,109,0.15)', padding: '2px 5px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Earn</span>
                          )}
                          {row.fdaDate && daysUntil(row.fdaDate) <= 7 && (
                            <span style={{ fontSize: 9, fontFamily: 'Cabin', fontWeight: 700, color: '#b57bee', background: 'rgba(181,123,238,0.15)', padding: '2px 5px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>FDA</span>
                          )}
                          {!row.hasNearCatalyst && <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11 }}>—</span>}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="tooltip-wrap">
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%', margin: '0 auto',
                            background: armed ? '#00d4aa' : 'rgba(255,255,255,0.12)',
                            boxShadow: armed ? '0 0 6px #00d4aa' : 'none',
                          }} />
                          <div className="tooltip-box">
                            {armed ? 'All criteria pass' : [
                              row.marketCap < 1 || row.marketCap > 10 ? `MCap ✗` : null,
                              row.ivRank < 80 ? `IVR ${row.ivRank}% ✗` : null,
                              row.bullishFlowPct < 70 ? `Bull ${row.bullishFlowPct}% ✗` : null,
                              row.volOI >= 0.5 || row.volOI === 0 ? `V/OI ✗` : null,
                              row.largestOrder < 30000 ? `Order <$30K ✗` : null,
                            ].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => onSelectTicker(row.ticker)}
                          disabled={row.hasNearCatalyst}
                          style={{
                            fontFamily: 'Cabin', fontSize: 11, fontWeight: 500,
                            padding: '4px 10px', borderRadius: 7, cursor: 'pointer',
                            background: row.hasNearCatalyst ? 'transparent' : 'rgba(123,57,252,0.15)',
                            color: row.hasNearCatalyst ? 'rgba(255,255,255,0.2)' : '#c4b5fd',
                            border: `1px solid ${row.hasNearCatalyst ? 'rgba(255,255,255,0.06)' : 'rgba(123,57,252,0.3)'}`,
                            transition: 'all .15s',
                          }}
                          onMouseEnter={e => { if (!row.hasNearCatalyst) { e.currentTarget.style.background = 'rgba(123,57,252,0.28)'; }}}
                          onMouseLeave={e => { if (!row.hasNearCatalyst) { e.currentTarget.style.background = 'rgba(123,57,252,0.15)'; }}}
                        >
                          {row.hasNearCatalyst ? 'Skip ⚠' : 'Plan →'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer count */}
      {data && !loading && (
        <p style={{ marginTop: 10, textAlign: 'right', fontSize: 11, fontFamily: 'Manrope', color: 'rgba(255,255,255,0.2)' }}>
          {sorted.length} of {data.count} tickers · {passingCount} pass all criteria
        </p>
      )}
    </div>
  );
}
