import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Bell, Pencil, Check, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { getPortfolio, addPosition, updatePosition, removePositions, importPositions, inferMarket } from '../../services/firestore.js';
import { fmtPct, fmtMoneyForMarket, symbolForMarket } from '../../utils/format.js';
import PortfolioHealth from './PortfolioHealth.jsx';

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g,'_').replace(/[^a-z0-9_]/g,''));
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const row = {};
    headers.forEach((h, i) => { row[h] = (vals[i] || '').trim().replace(/^"|"$/g, ''); });
    return row;
  });
}

const editInputStyle = {
  width: '100%', minWidth: 64, padding: '5px 8px', fontSize: 12, borderRadius: 6,
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(123,57,252,0.45)',
  color: '#fff', fontFamily: "'Cabin', sans-serif", outline: 'none',
};

function IconBtn({ icon: I, title, onClick, color = 'rgba(255,255,255,0.4)', hoverColor = '#c4b5fd', hoverBg = 'rgba(123,57,252,0.12)' }) {
  return (
    <button onClick={onClick} title={title}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer', background: 'transparent', color, transition: 'all .15s', marginLeft: 2 }}
      onMouseEnter={e => { e.currentTarget.style.color = hoverColor; e.currentTarget.style.background = hoverBg; }}
      onMouseLeave={e => { e.currentTarget.style.color = color; e.currentTarget.style.background = 'transparent'; }}>
      <I size={14} />
    </button>
  );
}

export default function Portfolio({ onCreateAlert }) {
  const { user } = useAuth();
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [csvImporting, setCsvImporting] = useState(false);
  const [form, setForm] = useState({ ticker: '', shares: '', avgCost: '', notes: '', market: 'US' });
  const [error, setError] = useState('');
  const [importResult, setImportResult] = useState(null);

  // selection + bulk delete
  const [selected, setSelected] = useState(() => new Set());
  const [bulkArmed, setBulkArmed] = useState(false);
  const selectAllRef = useRef();

  // inline edit
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ shares: '', avgCost: '', notes: '' });
  const [editError, setEditError] = useState('');

  const fileRef = useRef();

  useEffect(() => {
    if (!user?.id) return;
    getPortfolio(user.id).then(setPositions).catch(() => {}).finally(() => setLoading(false));
  }, [user?.id]);

  // header "select all" indeterminate state
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = selected.size > 0 && selected.size < positions.length;
  }, [selected, positions.length]);

  async function handleAdd(e) {
    e.preventDefault(); setError('');
    try {
      const ticker = form.ticker.toUpperCase().trim();
      const market = inferMarket(ticker) === 'IN' ? 'IN' : form.market;
      const pos = await addPosition(user.id, { ticker, shares: parseFloat(form.shares), avgCost: parseFloat(form.avgCost), notes: form.notes, market });
      setPositions(p => [...p, pos]);
      setForm({ ticker: '', shares: '', avgCost: '', notes: '', market: 'US' });
      setAddOpen(false);
    } catch (err) { setError(err.message); }
  }

  async function handleCSV(e) {
    const file = e.target.files?.[0]; if (!file) return;
    setCsvImporting(true); setImportResult(null);
    try {
      const rows = parseCSV(await file.text());
      const result = await importPositions(user.id, rows);
      setPositions(await getPortfolio(user.id));
      setImportResult(result);
    } catch (err) { setImportResult({ error: err.message }); }
    finally { setCsvImporting(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  // ── Selection ──────────────────────────────────────────────────────────────
  function toggleSelect(id) {
    setBulkArmed(false);
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  const allSelected = positions.length > 0 && selected.size === positions.length;
  function toggleSelectAll() {
    setBulkArmed(false);
    setSelected(allSelected ? new Set() : new Set(positions.map(p => p.id)));
  }
  function clearSelection() { setSelected(new Set()); setBulkArmed(false); }

  async function handleBulkDelete() {
    if (!bulkArmed) {
      setBulkArmed(true);
      setTimeout(() => setBulkArmed(false), 4000);
      return;
    }
    const ids = [...selected];
    setBulkArmed(false);
    setSelected(new Set());
    if (editId && ids.includes(editId)) setEditId(null);
    setPositions(p => p.filter(x => !ids.includes(x.id)));
    await removePositions(user.id, ids).catch(() => {});
  }

  // ── Inline edit ──────────────────────────────────────────────────────────────
  function startEdit(p) {
    setEditError('');
    setEditId(p.id);
    setEditForm({ shares: String(p.shares ?? ''), avgCost: String(p.avgCost ?? ''), notes: p.notes || '' });
  }
  function cancelEdit() { setEditId(null); setEditError(''); }
  async function saveEdit(p) {
    const shares = parseFloat(editForm.shares);
    const avgCost = parseFloat(editForm.avgCost);
    if (isNaN(shares) || isNaN(avgCost) || shares <= 0 || avgCost <= 0) {
      setEditError('Shares and avg cost must be positive numbers.');
      return;
    }
    const patch = { shares, avgCost, notes: editForm.notes.trim() };
    setPositions(list => list.map(x => x.id === p.id ? { ...x, ...patch } : x));
    setEditId(null); setEditError('');
    await updatePosition(user.id, p.id, patch).catch(() => {});
  }

  const mktOf = (p) => p.market || inferMarket(p.ticker);
  const basisByMarket = positions.reduce((a, p) => { const m = mktOf(p); a[m] = (a[m] || 0) + (p.shares || 0) * (p.avgCost || 0); return a; }, {});
  const marketsPresent = [...new Set(positions.map(mktOf))].sort();
  const totalCostBasisLabel = marketsPresent.map(m => fmtMoneyForMarket(m, basisByMarket[m], true)).join(' · ') || '—';
  const topPos = positions.length ? [...positions].sort((a, b) => ((b.shares||0)*(b.avgCost||0)) - ((a.shares||0)*(a.avgCost||0)))[0] : null;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div className="purple-glow">
          <h1 className="screen-h1" style={{ position: 'relative', zIndex: 1 }}>Portfolio</h1>
          <p className="screen-sub" style={{ position: 'relative', zIndex: 1 }}>Persisted to Firestore · survives refreshes and restarts</p>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <label className="btn-ghost" style={{ cursor: csvImporting ? 'wait' : 'pointer' }}>
            {csvImporting ? 'Importing…' : '⬆ Import CSV'}
            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleCSV} />
          </label>
          <button className="btn-purple" onClick={() => setAddOpen(o => !o)}>
            + Add Position
          </button>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      {positions.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
          {[
            { label: 'Positions',       value: positions.length },
            { label: 'Total Cost Basis', value: totalCostBasisLabel },
            { label: 'Markets',         value: marketsPresent.map(m => m === 'IN' ? '🇮🇳' : '🇺🇸').join(' ') || '—' },
            { label: 'Largest Hold',    value: topPos?.ticker || '—' },
          ].map(({ label, value }) => (
            <div key={label} className="stat-card">
              <div className="sec-label" style={{ marginBottom: 6 }}>{label}</div>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, fontWeight: 400, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.02em' }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── CSV hint ────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 14, padding: '8px 14px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, fontSize: 11, fontFamily: 'Manrope', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: 6 }}>
        📋 CSV headers: <code style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>ticker, shares, avgCost</code> — column names auto-detected (e.g. <code style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>Avg Cost (USD)</code>). Re-importing an existing ticker updates it — no duplicates.
      </div>

      {/* ── Import result ───────────────────────────────────────────────── */}
      {importResult && (
        <div style={{ marginBottom: 14, padding: '9px 14px', borderRadius: 10, fontSize: 12, fontFamily: 'Manrope',
          background: importResult.error ? 'rgba(255,77,109,0.08)' : 'rgba(0,212,170,0.08)',
          border: `1px solid ${importResult.error ? 'rgba(255,77,109,0.2)' : 'rgba(0,212,170,0.2)'}`,
          color: importResult.error ? '#ff4d6d' : '#00d4aa',
        }}>
          {importResult.error
            ? `Import failed: ${importResult.error}`
            : `Imported ${importResult.imported} new${importResult.updated ? `, updated ${importResult.updated}` : ''}${importResult.errors?.length ? `, ${importResult.errors.length} skipped` : ''}.`}
        </div>
      )}

      {/* ── Portfolio Health Dashboard ──────────────────────────────────── */}
      {positions.length > 0 && !loading && (
        <>
          <div style={{ marginBottom: 8 }}>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, fontWeight: 400, color: 'rgba(255,255,255,0.85)', marginBottom: 2 }}>Portfolio Health</h2>
            <p style={{ fontFamily: 'Manrope', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Live metrics fetched from Yahoo Finance · educational estimates only</p>
          </div>
          <PortfolioHealth positions={positions} />
        </>
      )}

      {/* ── Add form ────────────────────────────────────────────────────── */}
      {addOpen && (
        <div className="p-card" style={{ padding: '20px 22px', marginBottom: 14, animation: 'fadeIn .2s ease' }}>
          <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18, color: 'rgba(255,255,255,0.85)', marginBottom: 16 }}>Add Position</p>
          <form onSubmit={handleAdd}>
            <div style={{ marginBottom: 14 }}>
              <label>Market</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {['US', 'IN'].map(m => (
                  <button key={m} type="button" onClick={() => setForm(f => ({ ...f, market: m }))}
                    style={{ padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Manrope', fontSize: 12.5, fontWeight: 600,
                      background: form.market === m ? 'rgba(123,57,252,0.2)' : 'rgba(255,255,255,0.04)',
                      border: form.market === m ? '1px solid rgba(123,57,252,0.45)' : '1px solid rgba(255,255,255,0.1)',
                      color: form.market === m ? '#c4b5fd' : 'rgba(255,255,255,0.5)' }}>
                    {m === 'IN' ? '🇮🇳 India (₹)' : '🇺🇸 US ($)'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: 12, marginBottom: 14 }}>
              {[
                { label: 'Ticker', ph: form.market === 'IN' ? 'RELIANCE.NS' : 'AAPL', key: 'ticker', type: 'text', upper: true },
                { label: 'Shares', ph: '100', key: 'shares', type: 'number' },
                { label: `Avg Cost (${form.market === 'IN' ? '₹' : '$'})`, ph: '150.00', key: 'avgCost', type: 'number' },
                { label: 'Notes (optional)', ph: 'Entry reason…', key: 'notes', type: 'text' },
              ].map(({ label, ph, key, type, upper }) => (
                <div key={key}>
                  <label>{label}</label>
                  <input type={type} placeholder={ph} value={form[key]}
                    onChange={e => setForm(f => { const v = upper ? e.target.value.toUpperCase() : e.target.value; const next = { ...f, [key]: v }; if (key === 'ticker' && /\.(NS|BO)$/i.test(v)) next.market = 'IN'; return next; })}
                    step={key === 'avgCost' ? '0.01' : key === 'shares' ? '0.001' : undefined}
                    required={key !== 'notes'}
                  />
                </div>
              ))}
            </div>
            {error && <p style={{ color: '#ff4d6d', fontSize: 12, marginBottom: 10, fontFamily: 'Manrope' }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn-purple" style={{ padding: '7px 18px', fontSize: 12 }}>Add Position</button>
              <button type="button" className="btn-ghost" style={{ padding: '7px 16px', fontSize: 12 }} onClick={() => setAddOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className="p-card">
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontFamily: 'Manrope', fontSize: 13 }}>
            Loading from Firestore…
          </div>
        ) : positions.length === 0 ? (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>💼</div>
            <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>No positions yet</p>
            <p style={{ fontFamily: 'Manrope', fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Add manually or import a CSV</p>
          </div>
        ) : (
          <>
            {/* Bulk action bar */}
            {selected.size > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,77,109,0.05)' }}>
                <span style={{ fontFamily: 'Manrope', fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>
                  {selected.size} selected
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={clearSelection} className="btn-ghost" style={{ padding: '5px 12px', fontSize: 11 }}>Clear</button>
                  <button onClick={handleBulkDelete}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'Manrope', fontSize: 11.5, fontWeight: 600, color: '#ff4d6d', background: bulkArmed ? 'rgba(255,77,109,0.22)' : 'rgba(255,77,109,0.1)', border: '1px solid rgba(255,77,109,0.4)', transition: 'all .15s' }}>
                    <Trash2 size={13} />
                    {bulkArmed ? `Click to confirm — delete ${selected.size}` : `Delete selected`}
                  </button>
                </div>
              </div>
            )}

            {editError && (
              <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,77,109,0.06)', fontFamily: 'Manrope', fontSize: 12, color: '#ff4d6d' }}>
                {editError}
              </div>
            )}

            <div style={{ overflowX: 'auto' }}>
              <table className="dt">
                <thead>
                  <tr>
                    <th style={{ width: 38, textAlign: 'center' }}>
                      <input ref={selectAllRef} type="checkbox" checked={allSelected} onChange={toggleSelectAll}
                        title="Select all" style={{ width: 15, height: 15, accentColor: '#7b39fc', cursor: 'pointer' }} />
                    </th>
                    <th style={{ width: 130 }}>Ticker</th>
                    <th>Shares</th>
                    <th>Avg Cost</th>
                    <th>Cost Basis</th>
                    <th style={{ minWidth: 130 }}>Portfolio %</th>
                    <th>Notes</th>
                    <th style={{ width: 90, textAlign: 'center' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map(p => {
                    const isSel = selected.has(p.id);
                    const editing = editId === p.id;
                    const mkt = mktOf(p);
                    const sh = editing ? parseFloat(editForm.shares) : p.shares;
                    const ac = editing ? parseFloat(editForm.avgCost) : p.avgCost;
                    const basis = (Number(sh) || 0) * (Number(ac) || 0);
                    const pct = (basisByMarket[mkt] || 0) > 0 ? (basis / basisByMarket[mkt]) * 100 : 0;
                    const addedDate = p.addedAt?.toDate ? p.addedAt.toDate() : (p.addedAt ? new Date(p.addedAt) : null);
                    return (
                      <tr key={p.id} style={{ background: editing ? 'rgba(123,57,252,0.08)' : isSel ? 'rgba(123,57,252,0.05)' : undefined }}>
                        <td style={{ textAlign: 'center' }}>
                          <input type="checkbox" checked={isSel} onChange={() => toggleSelect(p.id)}
                            style={{ width: 15, height: 15, accentColor: '#7b39fc', cursor: 'pointer' }} />
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                            <div className="ticker-sym">{p.ticker}</div>
                            <span title={mkt === 'IN' ? 'NSE / BSE · ₹' : 'US · $'} style={{ fontFamily: 'Manrope', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4, letterSpacing: '0.04em', background: mkt === 'IN' ? 'rgba(0,212,170,0.12)' : 'rgba(123,57,252,0.14)', color: mkt === 'IN' ? '#5eead4' : '#c4b5fd' }}>{mkt === 'IN' ? 'IN' : 'US'}</span>
                          </div>
                          {addedDate && <div className="ticker-name">{addedDate.toLocaleDateString()}</div>}
                        </td>

                        {editing ? (
                          <>
                            <td><input type="number" step="0.001" value={editForm.shares} autoFocus
                              onChange={e => setEditForm(f => ({ ...f, shares: e.target.value }))} style={editInputStyle} /></td>
                            <td><input type="number" step="0.01" value={editForm.avgCost}
                              onChange={e => setEditForm(f => ({ ...f, avgCost: e.target.value }))} style={editInputStyle} /></td>
                            <td><span className="tv" style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{fmtMoneyForMarket(mkt, basis)}</span></td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden', minWidth: 50 }}>
                                  <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: '#7b39fc', borderRadius: 2 }} />
                                </div>
                                <span style={{ fontFamily: 'Cabin', fontSize: 11, color: 'rgba(255,255,255,0.55)', minWidth: 34, textAlign: 'right' }}>{fmtPct(pct)}</span>
                              </div>
                            </td>
                            <td><input type="text" value={editForm.notes} placeholder="notes…"
                              onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} style={editInputStyle} /></td>
                            <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                              <IconBtn icon={Check} title="Save" onClick={() => saveEdit(p)} color="#00d4aa" hoverColor="#00d4aa" hoverBg="rgba(0,212,170,0.14)" />
                              <IconBtn icon={X} title="Cancel" onClick={cancelEdit} color="rgba(255,255,255,0.5)" hoverColor="#ff4d6d" hoverBg="rgba(255,77,109,0.12)" />
                            </td>
                          </>
                        ) : (
                          <>
                            <td><span className="tv">{Number(p.shares).toLocaleString()}</span></td>
                            <td><span className="tv">{fmtMoneyForMarket(mkt, p.avgCost)}</span></td>
                            <td><span className="tv" style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{fmtMoneyForMarket(mkt, basis)}</span></td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden', minWidth: 50 }}>
                                  <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: '#7b39fc', borderRadius: 2 }} />
                                </div>
                                <span style={{ fontFamily: 'Cabin', fontSize: 11, color: 'rgba(255,255,255,0.55)', minWidth: 34, textAlign: 'right' }}>{fmtPct(pct)}</span>
                              </div>
                            </td>
                            <td style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'Manrope', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.notes || '—'}
                            </td>
                            <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                              <IconBtn icon={Pencil} title="Edit position" onClick={() => startEdit(p)} />
                              <IconBtn icon={Bell} title={`Set a price alert for ${p.ticker}`} onClick={() => onCreateAlert?.(p.ticker)} />
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <p style={{ marginTop: 10, textAlign: 'center', fontSize: 10, fontFamily: 'Manrope', color: 'rgba(255,255,255,0.15)' }}>
        Educational use only · not investment advice · options trading involves substantial risk
      </p>
    </div>
  );
}
