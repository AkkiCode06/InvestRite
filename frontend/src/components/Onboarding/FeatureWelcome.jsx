import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import BackgroundVideo from '../Landing/BackgroundVideo.jsx';
import { WELCOMES } from './featureWelcome.js';

/**
 * First-visit welcome card for each feature page — shown once per feature, per
 * user/device. Uses the landing background video. Suppressed while the signup
 * tour is pending so the two never overlap.
 */
export default function FeatureWelcome({ feature, user }) {
  const uid = user?.id;
  const [shown, setShown] = useState(null);

  useEffect(() => {
    if (!uid || !feature || !WELCOMES[feature]) return;
    let pending, seen;
    try {
      pending = localStorage.getItem('ir_onboard_pending');
      seen    = localStorage.getItem(`ir_fw_${uid}_${feature}`);
    } catch { /* ignore */ }
    if (pending || seen) return;          // don't clash with the tour; show once only
    const t = setTimeout(() => setShown(feature), 350);   // let the page paint behind it
    return () => clearTimeout(t);
  }, [feature, uid]);

  useEffect(() => {
    if (!shown) return;
    const onKey = (e) => { if (e.key === 'Escape') dismiss(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [shown]);

  function dismiss() {
    if (uid && shown) { try { localStorage.setItem(`ir_fw_${uid}_${shown}`, '1'); } catch { /* ignore */ } }
    setShown(null);
  }

  const content = shown ? WELCOMES[shown] : null;
  const Icon = content?.icon;

  return (
    <AnimatePresence>
      {content && (
        <motion.div
          key={shown}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          style={{ position: 'fixed', inset: 0, zIndex: 3000 }}
        >
          {/* Vignette — dims the page edges; the page stays visible. Click to dismiss. */}
          <div onClick={dismiss} style={{ position: 'absolute', inset: 0, cursor: 'pointer',
            background: 'radial-gradient(ellipse 75% 70% at 50% 46%, rgba(5,5,12,0.20) 0%, rgba(5,5,12,0.55) 58%, rgba(5,5,12,0.88) 100%)' }} />

          {/* Popup card — the video lives inside it (doesn't cover the whole page) */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, pointerEvents: 'none' }}>
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: 'relative', width: '100%', maxWidth: 460, borderRadius: 22, overflow: 'hidden',
                border: '1px solid rgba(123,57,252,0.32)', boxShadow: '0 30px 90px rgba(0,0,0,0.65)', background: '#0c0a18', pointerEvents: 'auto' }}
            >
              {/* video inside the card + readability gradient */}
              <div style={{ position: 'absolute', inset: 0 }}><BackgroundVideo /></div>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(12,10,24,0.28) 0%, rgba(12,10,24,0.82) 48%, rgba(12,10,24,0.98) 100%)' }} />

              {/* content */}
              <div style={{ position: 'relative', zIndex: 1, padding: '32px 36px 34px', textAlign: 'center' }}>
                <div style={{ width: 58, height: 58, borderRadius: 16, margin: '4px auto 20px', background: 'rgba(123,57,252,0.25)', border: '1px solid rgba(123,57,252,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 36px rgba(123,57,252,0.5)' }}>
                  {Icon && <Icon size={26} color="#e9d5ff" strokeWidth={1.8} />}
                </div>

                <div style={{ fontFamily: 'Manrope', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a78bfa', marginBottom: 10 }}>
                  Welcome to
                </div>
                <h1 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 'clamp(28px, 5vw, 38px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.12, marginBottom: 14, textShadow: '0 2px 20px rgba(0,0,0,0.45)' }}>
                  {content.title}
                </h1>
                <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.75)', marginBottom: 28 }}>
                  {content.desc}
                </p>

                <button
                  onClick={dismiss}
                  style={{ width: '100%', borderRadius: 14, background: '#7b39fc', color: '#fff', border: 'none', padding: '14px', fontFamily: 'Cabin, sans-serif', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'background .2s', boxShadow: '0 8px 28px rgba(123,57,252,0.4)' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#8f54fd'}
                  onMouseLeave={e => e.currentTarget.style.background = '#7b39fc'}
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
