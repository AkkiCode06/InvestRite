import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { api } from '../../utils/api.js';

/**
 * Global stock search with autocomplete (US + India + global, by name or ticker).
 * @param {function} onSelect  called with the chosen symbol
 * @param {function} onClose   called to dismiss (Esc / clear)
 */
export default function SearchBox({ onSelect, onClose, autoFocus = true }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { if (autoFocus) inputRef.current?.focus(); }, [autoFocus]);

  // Debounced search
  useEffect(() => {
    const query = q.trim();
    if (!query) { setResults([]); setLoading(false); return; }
    setLoading(true);
    const t = setTimeout(() => {
      api.search(query)
        .then(d => { setResults(d.results || []); setActive(0); setOpen(true); })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 240);
    return () => clearTimeout(t);
  }, [q]);

  function choose(sym) { onSelect?.(sym); }

  function onKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter') { if (results[active]) choose(results[active].symbol); }
    else if (e.key === 'Escape') { if (q) setQ(''); else onClose?.(); }
  }

  const showDrop = open && (loading || results.length > 0 || q.trim().length > 0);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 12px', height: 38, borderRadius: 10,
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(123,57,252,0.35)' }}>
        <Search size={15} color="rgba(196,181,253,0.8)" style={{ flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onKeyDown={onKey}
          onFocus={() => setOpen(true)}
          placeholder="Search any stock — name or ticker (US or India)"
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff',
            fontFamily: 'Manrope, sans-serif', fontSize: 13.5, padding: 0, minWidth: 0 }}
        />
        {q ? (
          <button onClick={() => { setQ(''); inputRef.current?.focus(); }} style={iconBtn} title="Clear"><X size={14} /></button>
        ) : onClose ? (
          <button onClick={onClose} style={iconBtn} title="Close search"><X size={14} /></button>
        ) : null}
      </div>

      {showDrop && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 80,
          background: 'rgba(12,10,24,0.98)', border: '1px solid rgba(123,57,252,0.25)', borderRadius: 12,
          padding: 6, boxShadow: '0 24px 60px rgba(0,0,0,0.55)', maxHeight: 360, overflowY: 'auto',
        }}>
          {loading && results.length === 0 && (
            <div style={{ padding: '14px 12px', fontFamily: 'Manrope', fontSize: 12.5, color: 'rgba(255,255,255,0.4)' }}>Searching…</div>
          )}
          {!loading && results.length === 0 && q.trim() && (
            <div style={{ padding: '14px 12px', fontFamily: 'Manrope', fontSize: 12.5, color: 'rgba(255,255,255,0.4)' }}>No matches for “{q.trim()}”.</div>
          )}
          {results.map((r, idx) => {
            const on = idx === active;
            return (
              <button key={r.symbol + idx}
                onMouseEnter={() => setActive(idx)}
                onClick={() => choose(r.symbol)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 9,
                  border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background .12s',
                  background: on ? 'rgba(123,57,252,0.16)' : 'transparent' }}>
                <span style={{ fontFamily: 'Cabin, sans-serif', fontSize: 13, fontWeight: 700, color: '#c4b5fd', minWidth: 64 }}>{r.symbol}</span>
                <span style={{ flex: 1, minWidth: 0, fontFamily: 'Manrope', fontSize: 12.5, color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                <span style={{ fontSize: 13 }}>{r.market === 'IN' ? '🇮🇳' : '🇺🇸'}</span>
                <span style={{ fontFamily: 'Manrope', fontSize: 10, color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>{r.exch}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const iconBtn = { background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 2, display: 'flex', flexShrink: 0 };
