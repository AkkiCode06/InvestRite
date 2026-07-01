import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import BackgroundVideo from './BackgroundVideo.jsx';
import LandingNavbar from './LandingNavbar.jsx';
import LegalModal from '../Legal/LegalModal.jsx';
import FeatureShowcase from './FeatureShowcase.jsx';
import { FEATURES, FEATURE_ORDER } from './featureContent.jsx';

const PRIMARY  = '#7b39fc';
const DARK_PUR = '#2b2344';
const footerLink = { background: 'none', border: 'none', padding: 0, color: 'rgba(196,181,253,0.85)', fontFamily: 'Manrope', fontSize: 11, fontWeight: 600, cursor: 'pointer' };

export default function FeaturePage({ feature, onSignIn, onGetStarted, onHome, onNavFeature }) {
  const [legal, setLegal] = useState(null);
  const f = FEATURES[feature] || FEATURES.screener;
  const Icon = f.icon;

  return (
    <main className="relative bg-black h-screen w-screen flex flex-col overflow-hidden selection:bg-white selection:text-black">
      <BackgroundVideo />

      <div className="relative z-10 flex flex-col" style={{ height: '100vh' }}>
        <LandingNavbar
          onSignIn={onSignIn}
          onGetStarted={onGetStarted}
          onHome={onHome}
          onNavFeature={onNavFeature}
          activeFeature={feature}
        />

        {/* Scrolling content over the fixed video */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          <div style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 24px 0', width: '100%' }}>

            {/* ── Hero ──────────────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto' }}
            >
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 9, height: 36, padding: '0 14px',
                background: 'rgba(85,80,110,0.40)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(164,132,215,0.50)', borderRadius: 10, marginBottom: 24,
              }}>
                <Icon size={15} color="#fff" />
                <span style={{ fontFamily: 'Cabin, sans-serif', fontWeight: 500, fontSize: 13, color: '#fff' }}>{f.eyebrow}</span>
              </div>

              <h1 style={{
                fontFamily: "'Instrument Serif', serif", fontWeight: 400,
                fontSize: 'clamp(38px, 6vw, 72px)', lineHeight: 1.1, color: '#fff',
                letterSpacing: '-0.02em', marginBottom: 20, textShadow: '0 2px 24px rgba(0,0,0,0.45)',
              }}>
                {f.titlePre}
                <em style={{ fontStyle: 'italic', color: '#c4b5fd' }}>{f.titleEm}</em>
                {f.titlePost}
              </h1>

              <p style={{
                fontFamily: 'Inter, sans-serif', fontSize: 17, color: 'rgba(255,255,255,0.72)',
                maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.65, textShadow: '0 1px 12px rgba(0,0,0,0.4)',
              }}>
                {f.subtitle}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 56 }}>
                <button onClick={onGetStarted}
                  style={{ fontFamily: 'Cabin, sans-serif', fontWeight: 500, fontSize: 16, color: '#fff', background: PRIMARY, border: 'none', borderRadius: 10, padding: '13px 28px', cursor: 'pointer', boxShadow: '0 6px 24px rgba(123,57,252,0.40)', transition: 'background .2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#8f54fd'}
                  onMouseLeave={e => e.currentTarget.style.background = PRIMARY}>
                  Get Started Free
                </button>
                <button onClick={onSignIn}
                  style={{ fontFamily: 'Cabin, sans-serif', fontWeight: 500, fontSize: 16, color: '#f6f7f9', background: DARK_PUR, border: 'none', borderRadius: 10, padding: '13px 28px', cursor: 'pointer', transition: 'background .2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#382d5a'}
                  onMouseLeave={e => e.currentTarget.style.background = DARK_PUR}>
                  Sign In
                </button>
              </div>
            </motion.div>

            {/* ── Feature showcase (bespoke charts per sub-feature) ─────── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.6 }}
              style={{ marginBottom: 36 }}
            >
              <div style={{ fontFamily: 'Manrope', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a78bfa', marginBottom: 14, textAlign: 'center' }}>
                Inside the {f.label}
              </div>
              <FeatureShowcase feature={feature} />
            </motion.div>

            {/* ── Explore other tools ───────────────────────────────────── */}
            <div style={{ marginBottom: 40 }}>
              <div style={{ fontFamily: 'Manrope', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.35)', marginBottom: 14, textAlign: 'center' }}>Explore the rest of InvestRite</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
                {FEATURE_ORDER.filter(k => k !== feature).map((k) => {
                  const o = FEATURES[k]; const OIcon = o.navIcon;
                  return (
                    <button key={k} onClick={() => onNavFeature(k)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 9999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontFamily: 'Manrope', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', transition: 'all .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(123,57,252,0.5)'; e.currentTarget.style.background = 'rgba(123,57,252,0.12)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}>
                      <OIcon size={14} color="#a78bfa" /> {o.label} <ArrowRight size={13} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Footer ────────────────────────────────────────────────── */}
            <footer style={{ padding: '8px 0 24px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'Manrope', fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                <span>© 2026 InvestRite — a free hobby project by Akshat Barjatya · not financial advice</span>
                <span style={{ opacity: 0.4 }}>·</span>
                <button onClick={() => setLegal('terms')} style={footerLink}>Terms</button>
                <span style={{ opacity: 0.4 }}>·</span>
                <button onClick={() => setLegal('privacy')} style={footerLink}>Privacy</button>
              </div>
            </footer>
          </div>
        </div>
      </div>

      <LegalModal doc={legal} onClose={() => setLegal(null)} />
    </main>
  );
}
