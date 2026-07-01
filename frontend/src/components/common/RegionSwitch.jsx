import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useRegion } from '../../context/RegionContext.jsx';

const OPTS = [
  { key: 'US', label: 'US',  flag: '🇺🇸', name: 'US Markets', sub: 'NYSE · NASDAQ · $' },
  { key: 'IN', label: 'IND', flag: '🇮🇳', name: 'India',      sub: 'NSE · BSE · ₹' },
];

export default function RegionSwitch({ segmented = false }) {
  const { region, setRegion } = useRegion();
  const [open, setOpen] = useState(false);
  const cur = OPTS.find(o => o.key === region) || OPTS[0];

  // Inline segmented control — used in the mobile menu (no z-index/portal issues).
  if (segmented) {
    return (
      <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.04)', padding: 4, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
        {OPTS.map(o => {
          const active = region === o.key;
          return (
            <button key={o.key} onClick={() => setRegion(o.key)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '9px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: active ? 'rgba(123,57,252,0.25)' : 'transparent', color: active ? '#c4b5fd' : 'rgba(255,255,255,0.55)',
                fontFamily: 'Manrope', fontSize: 13, fontWeight: 600, transition: 'all .15s' }}>
              <span style={{ fontSize: 15 }}>{o.flag}</span> {o.name}
            </button>
          );
        })}
      </div>
    );
  }

  // Dropdown — used in the desktop navbar.
  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} title="Switch market"
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 9, cursor: 'pointer',
          background: 'rgba(123,57,252,0.12)', border: '1px solid rgba(123,57,252,0.3)',
          fontFamily: 'Manrope', fontSize: 12.5, fontWeight: 600, color: '#c4b5fd', whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: 14 }}>{cur.flag}</span>{cur.label}
        <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
          <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 95, width: 210,
            background: 'rgba(12,10,24,0.98)', border: '1px solid rgba(123,57,252,0.25)', borderRadius: 12, padding: 6, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            {OPTS.map(o => {
              const active = region === o.key;
              return (
                <button key={o.key} onClick={() => { setRegion(o.key); setOpen(false); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '9px 11px', borderRadius: 9, border: 'none', cursor: 'pointer', textAlign: 'left',
                    background: active ? 'rgba(123,57,252,0.16)' : 'transparent', transition: 'background .15s' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                  <span style={{ fontSize: 18 }}>{o.flag}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontFamily: 'Manrope', fontSize: 13, fontWeight: 600, color: '#fff' }}>{o.name}</span>
                    <span style={{ display: 'block', fontFamily: 'Manrope', fontSize: 10.5, color: 'rgba(255,255,255,0.4)' }}>{o.sub}</span>
                  </span>
                  {active && <Check size={15} color="#c4b5fd" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
