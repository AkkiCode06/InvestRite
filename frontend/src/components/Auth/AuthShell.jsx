import { motion } from 'motion/react';
import { BarChart2, Rocket } from 'lucide-react';
import BackgroundVideo from '../Landing/BackgroundVideo.jsx';

function FeatureMini({ icon: I, title, text }) {
  return (
    <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: '14px 16px', borderRadius: 18, background: 'rgba(12,10,24,0.55)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', border: '1px solid rgba(255,255,255,0.12)', maxWidth: 255 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(123,57,252,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <I size={16} color="#c4b5fd" />
      </div>
      <div>
        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12.5, fontWeight: 700, color: '#fff' }}>{title}</div>
        <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.45, marginTop: 2 }}>{text}</div>
      </div>
    </div>
  );
}

/**
 * Split-screen auth layout.
 * Left: form (children). Right (md+): the shared video background + glass cards.
 * Mobile: the video fills the screen behind the form.
 */
export default function AuthShell({ children }) {
  return (
    <div className="relative flex flex-col md:flex-row overflow-hidden bg-black selection:bg-white selection:text-black" style={{ height: '100dvh', width: '100%' }}>
      {/* Mobile background video (hidden on desktop, where the right panel shows it) */}
      <div className="absolute inset-0 md:hidden" style={{ zIndex: 0 }}>
        <BackgroundVideo />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(4,4,12,0.55)' }} />
      </div>

      {/* Left: form column */}
      <section className="relative flex-1 flex justify-center overflow-y-auto p-6 md:p-10 md:bg-[#08070f]" style={{ zIndex: 10 }}>
        <div style={{ width: '100%', maxWidth: 420, margin: 'auto', paddingTop: 24, paddingBottom: 24 }}>
          {children}
        </div>
      </section>

      {/* Right: video + overlay (desktop only) */}
      <section className="hidden md:block relative flex-1">
        <motion.div
          initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: 'absolute', inset: 16, borderRadius: 24, overflow: 'hidden' }}
        >
          <BackgroundVideo />
          {/* subtle bottom scrim so the cards read clearly */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,5,14,0.8) 0%, rgba(5,5,14,0) 45%)', pointerEvents: 'none' }} />

          {/* Top pill */}
          <div style={{ position: 'absolute', top: 24, left: 24 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 13px', borderRadius: 10, background: 'rgba(85,80,110,0.4)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(164,132,215,0.5)', fontFamily: 'Cabin, sans-serif', fontSize: 12.5, color: '#fff' }}>
              Educational demo · not financial advice
            </span>
          </div>

          {/* Bottom feature cards (honest highlights in place of testimonials) */}
          <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
            <FeatureMini icon={BarChart2} title="Institutional options flow" text="Screen mid-cap flow with a 6-criteria filter." />
            <div className="hidden xl:block">
              <FeatureMini icon={Rocket} title="Multi-bagger scoring" text="6-layer fundamentals across US small-caps." />
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
