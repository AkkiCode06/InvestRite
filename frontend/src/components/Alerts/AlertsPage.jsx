import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Bell, BellRing, Plus, Trash2, Mail, Monitor, Pause, Play,
  RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Info,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import {
  getPortfolio, getAlerts, addAlert, updateAlert, removeAlert,
} from '../../services/firestore.js';
import { api } from '../../utils/api.js';
import { fmtDollar } from '../../utils/format.js';
import {
  ALERT_TYPES, ALERT_GROUPS, alertCondition, evaluateAlert,
} from '../../utils/alerts.js';

const PURPLE = '#7b39fc';

function tsToDate(ts) {
  if (!ts) return null;
  if (ts.toDate) return ts.toDate();
  if (typeof ts === 'number') return new Date(ts);
  return null;
}
function timeAgo(d) {
  if (!d) return '';
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return d.toLocaleDateString();
}

export default function AlertsPage({ initialTicker = null }) {
  const { user } = useAuth();
  const [alerts, setAlerts]       = useState([]);
  const [tickers, setTickers]     = useState([]);   // portfolio symbols
  const [quotes, setQuotes]       = useState({});   // ticker -> quote
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const [perm, setPerm]           = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');

  // ── Create form ──────────────────────────────────────────────────────────
  const [ticker, setTicker]   = useState(initialTicker || '');
  const [type, setType]       = useState('custom_below');
  const [target, setTarget]   = useState('');
  const [note, setNote]       = useState('');
  const [chEmail, setChEmail] = useState(true);
  const [chBrowser, setChBrowser] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formErr, setFormErr] = useState('');

  const meta = ALERT_TYPES[type] || {};

  // ── Load alerts + portfolio + quotes ───────────────────────────────────────
  const refreshQuotes = useCallback(async (symList) => {
    const list = [...new Set(symList)].filter(Boolean);
    if (!list.length) { setQuotes({}); return; }
    try {
      const { quotes: qs } = await api.portfolioHealth.quotes(list);
      const map = {};
      (qs || []).forEach(q => { map[q.ticker] = q; });
      setQuotes(map);
    } catch { /* ignore */ }
  }, []);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const [pf, al] = await Promise.all([
      getPortfolio(user.id).catch(() => []),
      getAlerts(user.id).catch(() => []),
    ]);
    const syms = [...new Set(pf.map(p => p.ticker))];
    setTickers(syms);
    setAlerts(al);
    if (!initialTicker && !ticker && syms[0]) setTicker(syms[0]);
    await refreshQuotes([...syms, ...al.map(a => a.ticker)]);
    setLoading(false);
  }, [user?.id, refreshQuotes, initialTicker, ticker]);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user?.id]);

  async function manualRefresh() {
    setRefreshing(true);
    await refreshQuotes([...tickers, ...alerts.map(a => a.ticker)]);
    setRefreshing(false);
  }

  // ── Browser notification permission ────────────────────────────────────────
  async function askPermission() {
    if (typeof Notification === 'undefined') return;
    const res = await Notification.requestPermission();
    setPerm(res);
  }

  // ── Prefill target sensibly when ticker/type changes ───────────────────────
  const liveQuote = quotes[(ticker || '').toUpperCase()];
  useEffect(() => {
    if (!meta.needsTarget) { setTarget(''); return; }
    if (!liveQuote?.price) return;
    // Suggest a level near the current price depending on intent
    const p = liveQuote.price;
    let suggested;
    if (type === 'custom_above' || type === 'dip_out') suggested = p * 1.05;
    else suggested = p * 0.95;
    setTarget(prev => (prev === '' ? suggested.toFixed(2) : prev));
    // eslint-disable-next-line
  }, [type, ticker, liveQuote?.price]);

  // ── Create ─────────────────────────────────────────────────────────────────
  async function handleCreate(e) {
    e?.preventDefault();
    setFormErr('');
    const T = (ticker || '').toUpperCase().trim();
    if (!T) { setFormErr('Pick or type a ticker.'); return; }
    if (meta.needsTarget) {
      const t = parseFloat(target);
      if (!(t > 0)) { setFormErr('Enter a valid trigger price.'); return; }
    }
    if (!chEmail && !chBrowser) { setFormErr('Choose at least one notification channel.'); return; }

    setCreating(true);
    try {
      const payload = {
        ticker: T,
        type,
        target: meta.needsTarget ? parseFloat(target) : null,
        note: note.trim(),
        channels: { email: chEmail, browser: chBrowser },
      };
      const saved = await addAlert(user.id, payload);
      setAlerts(a => [{ ...saved, createdAt: Date.now() }, ...a]);
      setNote(''); setFormErr('');
      // make sure we have a quote for a freshly-watched ticker
      if (!quotes[T]) refreshQuotes([...tickers, ...alerts.map(a => a.ticker), T]);
    } catch (err) {
      setFormErr(err.message || 'Could not create alert.');
    } finally { setCreating(false); }
  }

  async function toggleEnabled(a) {
    const enabled = !a.enabled;
    setAlerts(list => list.map(x => x.id === a.id ? { ...x, enabled } : x));
    await updateAlert(user.id, a.id, { enabled }).catch(() => {});
  }
  async function rearm(a) {
    setAlerts(list => list.map(x => x.id === a.id ? { ...x, triggeredAt: null, enabled: true } : x));
    await updateAlert(user.id, a.id, { triggeredAt: null, enabled: true }).catch(() => {});
  }
  async function del(a) {
    if (confirmId !== a.id) {
      setConfirmId(a.id);
      setTimeout(() => setConfirmId(c => (c === a.id ? null : c)), 3000);
      return;
    }
    setConfirmId(null);
    setAlerts(list => list.filter(x => x.id !== a.id));
    await removeAlert(user.id, a.id).catch(() => {});
  }

  // already-met hint for the create form
  const alreadyMet = useMemo(() => {
    if (!ticker || !liveQuote) return false;
    const probe = { ticker: ticker.toUpperCase(), type, target: parseFloat(target) };
    return !!evaluateAlert(probe, liveQuote);
  }, [ticker, type, target, liveQuote]);

  const armedCount = alerts.filter(a => a.enabled && !a.triggeredAt).length;
  const firedCount = alerts.filter(a => a.triggeredAt).length;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div className="purple-glow">
          <h1 className="screen-h1" style={{ position: 'relative', zIndex: 1 }}>Price Alerts</h1>
          <p className="screen-sub" style={{ position: 'relative', zIndex: 1 }}>
            Watch your holdings · email + browser notifications when a level is hit
          </p>
        </div>
        <button className="btn-ghost" onClick={manualRefresh} style={{ marginTop: 4 }} disabled={refreshing}>
          <RefreshCw size={13} className={refreshing ? 'spin' : ''} /> {refreshing ? 'Refreshing…' : 'Refresh prices'}
        </button>
      </div>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Armed alerts', value: armedCount },
          { label: 'Triggered',    value: firedCount },
          { label: 'Tickers watched', value: new Set(alerts.map(a => a.ticker)).size },
        ].map(({ label, value }) => (
          <div key={label} className="stat-card">
            <div className="sec-label" style={{ marginBottom: 6 }}>{label}</div>
            <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, color: 'rgba(255,255,255,0.9)' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── Browser permission banner ───────────────────────────────────── */}
      {perm !== 'granted' && perm !== 'unsupported' && (
        <div style={{ marginBottom: 14, padding: '11px 16px', borderRadius: 12, background: 'rgba(123,57,252,0.08)', border: '1px solid rgba(123,57,252,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'Manrope', fontSize: 12.5, color: 'rgba(255,255,255,0.7)' }}>
            <BellRing size={16} color={PURPLE} />
            Enable browser notifications to get pop-ups even on another tab.
          </div>
          <button className="btn-purple" style={{ padding: '6px 14px', fontSize: 12 }} onClick={askPermission}>
            {perm === 'denied' ? 'Blocked — enable in browser settings' : 'Enable notifications'}
          </button>
        </div>
      )}

      {/* ── How it works note ───────────────────────────────────────────── */}
      <div style={{ marginBottom: 16, padding: '9px 14px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, fontSize: 11, fontFamily: 'Manrope', color: 'rgba(255,255,255,0.32)', display: 'flex', alignItems: 'center', gap: 7 }}>
        <Info size={13} style={{ flexShrink: 0 }} />
        Prices are checked while InvestRite is open in a tab. Keep it open to receive alerts; emails are sent to your account address.
      </div>

      {/* ── Create alert card ───────────────────────────────────────────── */}
      <div className="p-card" style={{ padding: '20px 22px', marginBottom: 18 }}>
        <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: 18, color: 'rgba(255,255,255,0.85)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} color={PURPLE} /> New alert
        </p>
        <form onSubmit={handleCreate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.4fr 1fr', gap: 12, marginBottom: 12 }}>
            {/* Ticker */}
            <div>
              <label>Ticker</label>
              <input
                list="alert-ticker-list"
                value={ticker}
                onChange={e => setTicker(e.target.value.toUpperCase())}
                placeholder={tickers[0] || 'AAPL'}
              />
              <datalist id="alert-ticker-list">
                {tickers.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>
            {/* Type */}
            <div>
              <label>Condition</label>
              <select value={type} onChange={e => { setType(e.target.value); setTarget(''); }}>
                {ALERT_GROUPS.map(g => (
                  <optgroup key={g} label={g}>
                    {Object.entries(ALERT_TYPES).filter(([, m]) => m.group === g).map(([k, m]) => (
                      <option key={k} value={k}>{m.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            {/* Target */}
            <div>
              <label>{meta.needsTarget ? meta.targetLabel : 'Auto level'}</label>
              {meta.needsTarget ? (
                <input type="number" step="0.01" value={target} onChange={e => setTarget(e.target.value)} placeholder="0.00" />
              ) : (
                <input value="From live market data" disabled style={{ opacity: 0.5 }} />
              )}
            </div>
          </div>

          {/* Live context line */}
          <div style={{ fontFamily: 'Manrope', fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginBottom: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {liveQuote?.price ? (
              <>
                <span>Now: <strong style={{ color: '#c4b5fd' }}>{fmtDollar(liveQuote.price)}</strong></span>
                {liveQuote.dayLow != null && <span>Day: {fmtDollar(liveQuote.dayLow)} – {fmtDollar(liveQuote.dayHigh)}</span>}
                {liveQuote.week52Low != null && <span>52w: {fmtDollar(liveQuote.week52Low)} – {fmtDollar(liveQuote.week52High)}</span>}
              </>
            ) : (
              <span style={{ opacity: 0.6 }}>{ticker ? 'Fetching live price…' : 'Choose a ticker to see live price'}</span>
            )}
          </div>

          {/* Description of the chosen type */}
          {meta.desc && (
            <div style={{ fontFamily: 'Manrope', fontSize: 11.5, color: 'rgba(255,255,255,0.5)', marginBottom: 12, lineHeight: 1.5 }}>
              {meta.desc} {meta.action && <span style={{ color: '#a78bfa' }}>→ {meta.action}</span>}
            </div>
          )}

          {/* Channels + note */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto auto 1fr', gap: 12, alignItems: 'end', marginBottom: 12 }}>
            <div>
              <label>Notify by</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <ChannelChip active={chEmail} onClick={() => setChEmail(v => !v)} icon={Mail} label="Email" />
                <ChannelChip active={chBrowser} onClick={() => setChBrowser(v => !v)} icon={Monitor} label="Browser" />
              </div>
            </div>
            <div style={{ gridColumn: '3 / 4' }}>
              <label>Note (optional)</label>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. add on weakness" maxLength={80} />
            </div>
          </div>

          {alreadyMet && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: 'Manrope', fontSize: 11.5, color: '#ffd166', marginBottom: 10 }}>
              <AlertTriangle size={13} /> This condition is already met — it'll trigger on the next price check.
            </div>
          )}
          {formErr && <p style={{ color: '#ff4d6d', fontSize: 12, marginBottom: 10, fontFamily: 'Manrope' }}>{formErr}</p>}

          <button type="submit" className="btn-purple" disabled={creating}>
            <Bell size={14} /> {creating ? 'Creating…' : 'Create alert'}
          </button>
        </form>
      </div>

      {/* ── Alerts list ─────────────────────────────────────────────────── */}
      <div className="p-card">
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontFamily: 'Manrope', fontSize: 13 }}>Loading alerts…</div>
        ) : alerts.length === 0 ? (
          <div style={{ padding: 56, textAlign: 'center' }}>
            <Bell size={32} color="rgba(255,255,255,0.18)" style={{ marginBottom: 12 }} />
            <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: 20, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>No alerts yet</p>
            <p style={{ fontFamily: 'Manrope', fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Create one above to start tracking a price level.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="dt">
              <thead>
                <tr>
                  <th style={{ width: 150 }}>Ticker</th>
                  <th>Condition</th>
                  <th>Current</th>
                  <th>Notify</th>
                  <th>Status</th>
                  <th style={{ width: 150, textAlign: 'right' }}></th>
                </tr>
              </thead>
              <tbody>
                {alerts.map(a => {
                  const q = quotes[a.ticker];
                  const m = ALERT_TYPES[a.type] || {};
                  const firedAt = tsToDate(a.triggeredAt);
                  const armed = confirmId === a.id;
                  return (
                    <tr key={a.id} style={{ opacity: a.enabled ? 1 : 0.5 }}>
                      <td>
                        <div className="ticker-sym">{a.ticker}</div>
                        {a.note && <div className="ticker-name" style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.note}</div>}
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'Manrope', fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                          {m.sentiment === 'up' ? <TrendingUp size={13} color="#00d4aa" /> : <TrendingDown size={13} color="#ff4d6d" />}
                          {alertCondition(a)}
                        </span>
                      </td>
                      <td><span className="tv">{q?.price != null ? fmtDollar(q.price) : '—'}</span></td>
                      <td>
                        <span style={{ display: 'inline-flex', gap: 5 }}>
                          {a.channels?.email && <Mail size={13} color="rgba(196,181,253,0.8)" />}
                          {a.channels?.browser && <Monitor size={13} color="rgba(196,181,253,0.8)" />}
                        </span>
                      </td>
                      <td>
                        {firedAt ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'Manrope', fontSize: 11, fontWeight: 600, color: m.sentiment === 'up' ? '#00d4aa' : '#ff4d6d' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.sentiment === 'up' ? '#00d4aa' : '#ff4d6d' }} />
                            Triggered {timeAgo(firedAt)}
                          </span>
                        ) : !a.enabled ? (
                          <span style={{ fontFamily: 'Manrope', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>Paused</span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'Manrope', fontSize: 11, fontWeight: 600, color: '#a78bfa' }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: PURPLE, boxShadow: '0 0 7px ' + PURPLE }} />
                            Armed
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {firedAt && (
                          <button className="alert-act" onClick={() => rearm(a)} title="Re-arm this alert" style={actBtn}>
                            <RefreshCw size={13} />
                          </button>
                        )}
                        {!firedAt && (
                          <button className="alert-act" onClick={() => toggleEnabled(a)} title={a.enabled ? 'Pause' : 'Resume'} style={actBtn}>
                            {a.enabled ? <Pause size={13} /> : <Play size={13} />}
                          </button>
                        )}
                        <button
                          onClick={() => del(a)}
                          title={armed ? 'Click again to confirm' : 'Delete alert'}
                          style={{ ...actBtn, color: armed ? '#ff4d6d' : 'rgba(255,255,255,0.4)', background: armed ? 'rgba(255,77,109,0.15)' : 'transparent', outline: armed ? '1px solid rgba(255,77,109,0.3)' : 'none', width: armed ? 'auto' : 30, padding: armed ? '0 9px' : 0, fontSize: 10, fontWeight: 600, fontFamily: 'Manrope', gap: 4 }}
                        >
                          <Trash2 size={13} />{armed && 'Confirm?'}
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

      <p style={{ marginTop: 10, textAlign: 'center', fontSize: 10, fontFamily: 'Manrope', color: 'rgba(255,255,255,0.15)' }}>
        Educational notifications only · not investment advice · buy/sell suggestions are illustrative
      </p>
    </div>
  );
}

const actBtn = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 30, height: 28, borderRadius: 7, border: 'none', cursor: 'pointer',
  background: 'transparent', color: 'rgba(255,255,255,0.4)', marginLeft: 4,
  transition: 'all .15s',
};

function ChannelChip({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 9, cursor: 'pointer',
        fontFamily: 'Manrope', fontSize: 12.5, fontWeight: 600,
        background: active ? 'rgba(123,57,252,0.18)' : 'rgba(255,255,255,0.04)',
        border: active ? '1px solid rgba(123,57,252,0.4)' : '1px solid rgba(255,255,255,0.1)',
        color: active ? '#c4b5fd' : 'rgba(255,255,255,0.4)',
        transition: 'all .15s',
      }}
    >
      <Icon size={14} /> {label}
    </button>
  );
}
