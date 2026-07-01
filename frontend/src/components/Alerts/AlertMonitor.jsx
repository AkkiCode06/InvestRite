import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, TrendingUp, TrendingDown } from 'lucide-react';
import { getAlerts, updateAlert } from '../../services/firestore.js';
import { api } from '../../utils/api.js';
import {
  ALERT_TYPES, evaluateAlert, alertMessage, alertTitle,
} from '../../utils/alerts.js';

const POLL_MS = 60 * 1000;   // check prices every 60s while the app is open
const FIRST_DELAY = 4000;    // small settle delay after mount

/**
 * Global, headless-ish alert engine. Mounted once (in App) while logged in.
 * Renders a bottom-right toast stack; also fires browser notifications + emails.
 */
export default function AlertMonitor({ user }) {
  const [toasts, setToasts] = useState([]);
  const busyRef  = useRef(false);

  const pushToast = useCallback((t) => {
    setToasts(list => [...list, t].slice(-4));
    setTimeout(() => setToasts(list => list.filter(x => x.id !== t.id)), 13000);
  }, []);

  const fireNotification = useCallback((title, body) => {
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const n = new Notification(title, { body, tag: title, icon: '/favicon.ico' });
        n.onclick = () => { window.focus(); n.close(); };
      }
    } catch { /* ignore */ }
  }, []);

  const check = useCallback(async () => {
    if (!user?.id || busyRef.current) return;
    busyRef.current = true;
    try {
      const all = await getAlerts(user.id);
      const active = all.filter(a => a.enabled && !a.triggeredAt);
      if (!active.length) return;

      const syms = [...new Set(active.map(a => a.ticker))];
      const { quotes } = await api.portfolioHealth.quotes(syms).catch(() => ({ quotes: [] }));
      const qmap = {};
      (quotes || []).forEach(q => { qmap[q.ticker] = q; });

      for (const a of active) {
        const q = qmap[a.ticker];
        const fire = evaluateAlert(a, q);
        if (!fire) continue;

        // Persist triggered state first (Firestore applies the mutation to its
        // local cache immediately, so the next cycle won't re-fire this alert).
        updateAlert(user.id, a.id, { triggeredAt: Date.now(), lastPrice: fire.price }).catch(() => {});

        const meta  = ALERT_TYPES[a.type] || {};
        const title = alertTitle(a, fire);
        const body  = alertMessage(a, fire);

        // In-app toast (always)
        pushToast({ id: a.id + ':' + Date.now(), ticker: a.ticker, title, body, action: meta.action, sentiment: meta.sentiment });

        // Browser notification
        if (a.channels?.browser) fireNotification(title, body);

        // Email
        if (a.channels?.email) {
          api.email.priceAlert({
            ticker: a.ticker,
            title: meta.label,
            message: body,
            action: meta.action,
            price: fire.price,
            sentiment: meta.sentiment,
          }).catch(() => {});
        }
      }
    } catch { /* network hiccup — try again next cycle */ }
    finally { busyRef.current = false; }
  }, [user?.id, pushToast, fireNotification]);

  useEffect(() => {
    if (!user?.id) return;
    const first = setTimeout(check, FIRST_DELAY);
    const iv = setInterval(check, POLL_MS);
    // also re-check when the tab regains focus
    const onVis = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearTimeout(first); clearInterval(iv); document.removeEventListener('visibilitychange', onVis); };
  }, [user?.id, check]);

  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 200, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340, pointerEvents: 'none' }}>
      <AnimatePresence>
        {toasts.map(t => {
          const up = t.sentiment === 'up';
          const accent = up ? '#00d4aa' : '#ff4d6d';
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{
                pointerEvents: 'auto',
                background: 'rgba(14,11,30,0.96)',
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(123,57,252,0.3)',
                borderLeft: `3px solid ${accent}`,
                borderRadius: 13, padding: '13px 15px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: up ? 'rgba(0,212,170,0.12)' : 'rgba(255,77,109,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {up ? <TrendingUp size={15} color={accent} /> : <TrendingDown size={15} color={accent} />}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <Bell size={11} color="#a78bfa" />
                    <span style={{ fontFamily: 'Manrope', fontSize: 12.5, fontWeight: 700, color: '#fff' }}>{t.title}</span>
                  </div>
                  <div style={{ fontFamily: 'Manrope', fontSize: 11.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.45 }}>{t.body}</div>
                  {t.action && <div style={{ fontFamily: 'Manrope', fontSize: 11, color: '#c4b5fd', marginTop: 5 }}>{t.action}</div>}
                </div>
                <button
                  onClick={() => setToasts(list => list.filter(x => x.id !== t.id))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: 2, flexShrink: 0 }}
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
