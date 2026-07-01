import { useState, useEffect, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { getSteps } from './tourSteps.js';

const PURPLE = '#7b39fc';
const TW = 340;        // tooltip width
const PAD = 8;         // spotlight padding around target
const EST_H = 215;     // estimated tooltip height for placement

function clamp(v, lo, hi) { return Math.max(lo, Math.min(v, hi)); }

/**
 * First-run onboarding tour. Auto-starts after signup (a localStorage flag set
 * by register()), and can be replayed via the `investrite:start-tour` event.
 */
export default function Tour({ user }) {
  const uid = user?.id;
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState([]);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);

  function start() {
    setSteps(getSteps(window.innerWidth < 768));
    setI(0);
    setRect(null);
    setRun(true);
  }

  function finish() {
    setRun(false);
    try { if (uid) localStorage.setItem('ir_onboarded_' + uid, '1'); localStorage.removeItem('ir_onboard_pending'); } catch { /* ignore */ }
  }

  // Auto-start once, shortly after a fresh signup.
  useEffect(() => {
    if (!uid) return;
    let pending, done;
    try { pending = localStorage.getItem('ir_onboard_pending'); done = localStorage.getItem('ir_onboarded_' + uid); } catch { /* ignore */ }
    if (pending === uid && !done) {
      const t = setTimeout(start, 750);
      return () => clearTimeout(t);
    }
  }, [uid]);

  // Manual replay (e.g. from Profile).
  useEffect(() => {
    const h = () => start();
    window.addEventListener('investrite:start-tour', h);
    return () => window.removeEventListener('investrite:start-tour', h);
  }, []);

  function next() { setI(p => p + 1); }
  function back() { setI(p => Math.max(0, p - 1)); }

  // Finish once we advance past the last step.
  useEffect(() => { if (run && steps.length && i >= steps.length) finish(); /* eslint-disable-next-line */ }, [i, run, steps.length]);

  // Keyboard controls.
  useEffect(() => {
    if (!run) return;
    const onKey = (e) => {
      if (e.key === 'Escape') finish();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [run, steps.length]);

  // Resolve the current target's rect (or skip a missing target).
  useLayoutEffect(() => {
    if (!run) return;
    const step = steps[i];
    if (!step) { finish(); return; }
    if (!step.target) { setRect(null); return; }

    const el = document.querySelector(step.target);
    if (!el) { setI(p => p + 1); return; }   // skip a target that isn't on screen

    const update = () => {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    update();
    el.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
  }, [run, i, steps]);

  if (!run) return null;
  const step = steps[i];
  if (!step) return null;

  const centered = !rect;

  // ── Tooltip placement ──────────────────────────────────────────────────
  let tip, arrow = null;
  if (centered) {
    tip = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400 };
  } else {
    const below = (rect.top + rect.height) < window.innerHeight * 0.62;
    let top = below ? rect.top + rect.height + 16 : rect.top - 16 - EST_H;
    top = clamp(top, 16, window.innerHeight - EST_H - 16);
    const left = clamp(rect.left + rect.width / 2 - TW / 2, 16, window.innerWidth - TW - 16);
    tip = { top, left, width: TW };
    const aLeft = clamp(rect.left + rect.width / 2 - left, 22, TW - 22);
    arrow = { below, left: aLeft };
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 4000 }}>
      {/* Click-blocker + (for centered steps) full dark backdrop */}
      <div onClick={() => {}} style={{ position: 'absolute', inset: 0, background: centered ? 'rgba(6,6,14,0.92)' : 'transparent', backdropFilter: centered ? 'blur(2px)' : 'none', transition: 'background .3s' }} />

      {/* Spotlight — box-shadow darkens everything outside the target, purple glow lights it up */}
      {!centered && (
        <div style={{
          position: 'absolute',
          top: rect.top - PAD, left: rect.left - PAD,
          width: rect.width + PAD * 2, height: rect.height + PAD * 2,
          borderRadius: 12, pointerEvents: 'none',
          boxShadow: '0 0 0 9999px rgba(6,6,14,0.86), 0 0 0 2px rgba(123,57,252,0.85), 0 0 28px 6px rgba(123,57,252,0.55)',
          transition: 'top .38s cubic-bezier(.16,1,.3,1), left .38s cubic-bezier(.16,1,.3,1), width .38s cubic-bezier(.16,1,.3,1), height .38s cubic-bezier(.16,1,.3,1)',
        }} />
      )}

      {/* Tooltip / popover */}
      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute', ...tip,
            background: 'rgba(12,10,24,0.98)', border: '1px solid rgba(123,57,252,0.3)',
            borderRadius: 16, padding: '18px 20px', boxShadow: '0 24px 70px rgba(0,0,0,0.65)',
          }}
        >
          {/* arrow */}
          {arrow && (
            <div style={{
              position: 'absolute', left: arrow.left, transform: 'translateX(-50%)',
              [arrow.below ? 'top' : 'bottom']: -7,
              width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent',
              ...(arrow.below ? { borderBottom: '7px solid rgba(12,10,24,0.98)' } : { borderTop: '7px solid rgba(12,10,24,0.98)' }),
            }} />
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
            <span style={{ fontFamily: 'Manrope', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#a78bfa' }}>
              Step {i + 1} of {steps.length}
            </span>
            <button onClick={finish} title="Skip tour"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 2, display: 'flex' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
              <X size={16} />
            </button>
          </div>

          <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 22, fontWeight: 400, color: '#fff', letterSpacing: '-0.01em', marginBottom: 7 }}>
            {step.title}
          </h3>
          <p style={{ fontFamily: 'Manrope', fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.65)', marginBottom: 16 }}>
            {step.body}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 5 }}>
              {steps.map((_, idx) => (
                <span key={idx} style={{ width: idx === i ? 16 : 6, height: 6, borderRadius: 3, background: idx === i ? PURPLE : 'rgba(255,255,255,0.18)', transition: 'all .2s' }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {i > 0 && (
                <button onClick={back} className="btn-ghost" style={{ padding: '6px 14px', fontSize: 12 }}>Back</button>
              )}
              <button onClick={next} className="btn-purple" style={{ padding: '7px 18px', fontSize: 12.5 }}>
                {i === steps.length - 1 ? 'Done' : 'Next'}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
