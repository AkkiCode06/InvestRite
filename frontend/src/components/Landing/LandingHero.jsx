import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Check } from 'lucide-react';

const PRIMARY  = '#7b39fc';
const DARK_PUR = '#2b2344';

/* ── Typewriter hook ─────────────────────────────────────────────────────── */
function useTypewriter(text, active, speed = 52) {
  const [out, setOut] = useState('');
  useEffect(() => {
    if (!active) { setOut(''); return; }
    setOut('');
    let i = 0;
    const id = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, active, speed]);
  return out;
}

const PH_ENTER = 'Enter your email for early access';
const PH_DONE  = 'You will receive notifications shortly';

export default function LandingHero({ onGetStarted, onSignIn }) {
  const [ctaMode, setCtaMode] = useState('button'); // 'button' | 'form' | 'done'
  const [email, setEmail] = useState('');
  const inputRef = useRef(null);
  const placeholder = useTypewriter(
    ctaMode === 'done' ? PH_DONE : PH_ENTER,
    ctaMode === 'form' || ctaMode === 'done'
  );

  function openForm() { setCtaMode('form'); setTimeout(() => inputRef.current?.focus(), 80); }

  function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    setCtaMode('done');
    setTimeout(() => { setCtaMode('button'); setEmail(''); }, 4200);
  }

  return (
    <section
      className="relative flex-1 flex flex-col items-center text-center"
      style={{ marginTop: 120, zIndex: 10, paddingLeft: 24, paddingRight: 24 }}
    >
      {/* ── Glassmorphism tagline pill ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          height: 38, padding: '0 14px',
          background: 'rgba(85,80,110,0.40)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(164,132,215,0.50)',
          borderRadius: 10,
          marginBottom: 28,
        }}
      >
        <span style={{
          fontFamily: 'Cabin, sans-serif', fontWeight: 500, fontSize: 12,
          color: '#fff', background: PRIMARY,
          borderRadius: 6, padding: '2px 8px', letterSpacing: '0.02em',
        }}>
          New
        </span>
        <span style={{ fontFamily: 'Cabin, sans-serif', fontWeight: 500, fontSize: 14, color: '#fff' }}>
          Say hello to InvestRite Multi-Bagger v2.0
        </span>
      </motion.div>

      {/* ── Headline ─────────────────────────────────────────────────────── */}
      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{
          fontFamily: "'Instrument Serif', serif",
          fontWeight: 400,
          fontSize: 'clamp(42px, 7.5vw, 96px)',
          lineHeight: 1.1,
          color: '#fff',
          maxWidth: 880,
          marginBottom: 24,
          letterSpacing: '-0.02em',
        }}
      >
        Track where the{' '}
        <em style={{ fontStyle: 'italic', letterSpacing: '-0.01em' }}>big money</em>
        <br className="hidden md:block" />
        {' '}moves before it prints
      </motion.h1>

      {/* ── Subtext ──────────────────────────────────────────────────────── */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        style={{
          fontFamily: 'Inter, sans-serif', fontWeight: 400, fontSize: 18,
          color: 'rgba(255,255,255,0.70)',
          maxWidth: 662, marginBottom: 40, lineHeight: 1.65,
        }}
      >
        Screen institutional options flow across US mid-cap equities. Identify
        high-conviction setups with 6-layer filtering, real-time Yahoo Finance
        data, and multi-bagger scoring.
      </motion.p>

      {/* ── CTA row ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 48 }}
      >
        <button
          onClick={onGetStarted}
          style={{
            fontFamily: 'Cabin, sans-serif', fontWeight: 500, fontSize: 16,
            color: '#fff', background: PRIMARY,
            border: 'none', borderRadius: 10,
            padding: '13px 28px', cursor: 'pointer',
            boxShadow: '0 6px 24px rgba(123,57,252,0.40)',
            transition: 'background .2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#8f54fd'}
          onMouseLeave={e => e.currentTarget.style.background = PRIMARY}
        >
          Start Screening Free
        </button>

        <button
          onClick={onSignIn}
          style={{
            fontFamily: 'Cabin, sans-serif', fontWeight: 500, fontSize: 16,
            color: '#f6f7f9', background: DARK_PUR,
            border: 'none', borderRadius: 10,
            padding: '13px 28px', cursor: 'pointer',
            transition: 'background .2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#382d5a'}
          onMouseLeave={e => e.currentTarget.style.background = DARK_PUR}
        >
          Sign In
        </button>
      </motion.div>

      {/* ── Email capture (opt-in, below main CTAs) ──────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{ minHeight: 44, marginBottom: 20 }}
      >
        <AnimatePresence mode="wait">
          {ctaMode === 'button' ? (
            <motion.button
              key="pill-btn"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={openForm}
              style={{
                fontFamily: 'Cabin, sans-serif', fontWeight: 500, fontSize: 14,
                color: 'rgba(255,255,255,0.65)',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 9999, padding: '10px 22px',
                cursor: 'pointer', backdropFilter: 'blur(4px)',
                transition: 'border-color .2s, color .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
            >
              Get early access →
            </motion.button>
          ) : (
            <motion.form
              key="email-form"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.18 }}
              onSubmit={handleSubmit}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 6px 6px 20px',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 9999,
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(6px)',
                width: '100%', maxWidth: 340,
              }}
            >
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={placeholder}
                disabled={ctaMode === 'done'}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontFamily: 'Cabin, sans-serif', fontSize: 14, color: '#fff',
                  padding: 0, minWidth: 0,
                }}
              />
              <button
                type="submit"
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: ctaMode === 'done' ? '#00d4aa' : PRIMARY,
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'background .2s',
                }}
              >
                {ctaMode === 'done'
                  ? <Check size={14} color="#fff" />
                  : <ArrowRight size={14} color="#fff" />
                }
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Disclaimer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.02em' }}
      >
        Educational use only · Yahoo Finance data · Not investment advice
      </motion.p>
    </section>
  );
}
