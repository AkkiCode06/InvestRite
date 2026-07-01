import { useState, useRef, useCallback } from 'react';

const FILTER_INFO = {
  marketCapMin: {
    title: 'Market Cap — Minimum',
    description: 'Smallest company size to include. Mid-caps have enough institutional presence to generate significant options flow while still having room to grow.',
    why: 'Too small = illiquid options, too big = already well-known',
    unit: '$B', type: 'number', step: 0.1, min: 0.01, max: 50,
  },
  marketCapMax: {
    title: 'Market Cap — Maximum',
    description: 'Largest company size to include. Keeping a $10B ceiling focuses on stocks where a single institutional bet can still move the price meaningfully.',
    why: 'Large-caps have too many offsetting flows to read directional conviction',
    unit: '$B', type: 'number', step: 0.5, min: 0.5, max: 100,
  },
  minPremium: {
    title: 'Minimum Premium per Order',
    description: 'Filters out retail noise. Any single options order below this threshold is ignored. Institutional desks typically print $30K–$500K+ in a single ticket.',
    why: 'Small orders ($1K–$5K) are retail — they add noise, not signal',
    unit: '$K', type: 'number', step: 5, min: 5, max: 500,
  },
  ivRank: {
    title: 'IV Rank (Minimum)',
    description: 'Shows where current implied volatility sits vs its 52-week range. 80%+ means the market is pricing in significant movement — ideal for detecting high-conviction options bets.',
    why: 'Low IV = cheap options = could be directional or hedging. High IV = premium bets',
    unit: '%', type: 'number', step: 5, min: 0, max: 100,
  },
  bullFlow: {
    title: 'Bullish Flow % (Minimum)',
    description: 'Percentage of total options premium flowing into calls vs puts. 70%+ means the smart money is overwhelmingly positioning for upside.',
    why: 'Below 60% = ambiguous. Above 70% = clear directional conviction',
    unit: '%', type: 'number', step: 5, min: 50, max: 100,
  },
  volOI: {
    title: 'Volume / Open Interest (Maximum)',
    description: 'Daily volume divided by existing open interest. Under 0.5 means positions are being built over multiple days — institutional accumulation, not day-trading.',
    why: 'High V/OI = retail momentum. Low V/OI = patient institutional positioning',
    unit: 'ratio', type: 'number', step: 0.05, min: 0.01, max: 2,
  },
  dteMin: {
    title: 'DTE — Minimum Days to Expiry',
    description: 'Shortest expiry to consider. Below 15 days is "theta land" — options lose value fast. Institutions prefer more time for their thesis to play out.',
    why: 'Under 15d = weekly gamble. 15–60d = structured bet',
    unit: 'days', type: 'number', step: 5, min: 1, max: 30,
  },
  dteMax: {
    title: 'DTE — Maximum Days to Expiry',
    description: 'Longest expiry to consider. Beyond 60 days, options are "LEAPS territory" — harder to attribute to specific near-term flow. 15–60d is the institutional sweet spot.',
    why: 'Too far out = could be portfolio hedging, not directional bet',
    unit: 'days', type: 'number', step: 5, min: 20, max: 180,
  },
};

export default function FilterChip({ filterKey, label, displayValue, value, defaultValue, onChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [pos, setPos] = useState({ top: 0, left: 0, right: null });
  const chipRef = useRef(null);
  const popRef = useRef(null);
  const hideTimer = useRef(null);

  const info = FILTER_INFO[filterKey];

  const showPop = useCallback(() => {
    clearTimeout(hideTimer.current);
    if (!chipRef.current) return;
    const rect = chipRef.current.getBoundingClientRect();
    const popW = 320;
    const left = Math.min(rect.left, window.innerWidth - popW - 16);
    setPos({ top: rect.bottom + 10, left: Math.max(8, left) });
    setDraft(String(value));
    setOpen(true);
  }, [value]);

  const hidePop = useCallback(() => {
    hideTimer.current = setTimeout(() => setOpen(false), 160);
  }, []);

  const cancelHide = useCallback(() => clearTimeout(hideTimer.current), []);

  function handleSave() {
    const num = parseFloat(draft);
    if (!isNaN(num)) onChange(filterKey, num);
    setOpen(false);
  }

  function handleReset() {
    onChange(filterKey, defaultValue);
    setDraft(String(defaultValue));
    setOpen(false);
  }

  // "modified" means user has moved it away from the open default (i.e. it's now filtering)
  const isModified = value !== defaultValue;

  return (
    <>
      <span
        ref={chipRef}
        className="filter-pill"
        style={{
          cursor: 'pointer',
          background: isModified ? 'rgba(123,57,252,0.12)' : undefined,
          borderColor: isModified ? 'rgba(123,57,252,0.3)' : undefined,
          color: isModified ? '#c4b5fd' : undefined,
          userSelect: 'none',
        }}
        onMouseEnter={showPop}
        onMouseLeave={hidePop}
      >
        {label}: <span className="val">{displayValue}</span>
        {isModified && <span style={{ color: '#a78bfa', fontSize: 9, marginLeft: 3 }}>✎</span>}
      </span>

      {open && info && (
        <div
          ref={popRef}
          onMouseEnter={cancelHide}
          onMouseLeave={hidePop}
          style={{
            position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999,
            width: 320,
            background: 'rgba(12,10,22,0.96)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(123,57,252,0.3)',
            borderRadius: 14,
            padding: '16px 18px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(123,57,252,0.1)',
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: 'Instrument Serif', fontSize: 16, color: '#fff', fontWeight: 400, marginBottom: 4 }}>
              {info.title}
            </div>
            <div style={{ fontFamily: 'Inter', fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
              {info.description}
            </div>
          </div>

          {/* Why it matters */}
          <div style={{
            background: 'rgba(123,57,252,0.08)', border: '1px solid rgba(123,57,252,0.2)',
            borderRadius: 8, padding: '8px 10px', marginBottom: 14,
          }}>
            <div style={{ fontFamily: 'Manrope', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a78bfa', marginBottom: 3 }}>
              Why it matters
            </div>
            <div style={{ fontFamily: 'Inter', fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
              {info.why}
            </div>
          </div>

          {/* Edit */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontFamily: 'Manrope', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 6 }}>
              Adjust value ({info.unit})
            </label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                step={info.step}
                min={info.min}
                max={info.max}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                style={{
                  flex: 1, fontFamily: 'Cabin', fontSize: 14, fontWeight: 600,
                  padding: '7px 12px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(123,57,252,0.3)',
                  color: '#c4b5fd',
                }}
                autoFocus
              />
              <button onClick={handleSave} style={{
                fontFamily: 'Cabin', fontSize: 12, fontWeight: 600,
                padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                background: '#7b39fc', color: '#fff', border: 'none',
              }}>Apply</button>
            </div>
          </div>

          {/* Reset */}
          {isModified && (
            <button onClick={handleReset} style={{
              fontFamily: 'Manrope', fontSize: 11, color: 'rgba(255,255,255,0.3)',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '2px 0', letterSpacing: '0.02em',
            }}>
              ↺ Reset to default ({defaultValue})
            </button>
          )}
        </div>
      )}
    </>
  );
}
