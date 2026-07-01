import { useState } from 'react';
import { ChevronDown, Menu, X, TrendingUp } from 'lucide-react';
import { FEATURES, FEATURE_ORDER, MAIN_FEATURES, MORE_FEATURES } from './featureContent.jsx';

const PRIMARY   = '#7b39fc';
const DARK_PUR  = '#2b2344';

/* ── Shared Logo ─────────────────────────────────────────────────────────── */
export function Logo({ size = 'md' }) {
  const textSz = size === 'sm' ? '15px' : '17px';
  const iconSz = size === 'sm' ? 16 : 18;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <TrendingUp size={iconSz} color="#fff" strokeWidth={2.2} />
      <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: textSz, color: '#fff', letterSpacing: '-0.02em' }}>
        Invest<span style={{ color: PRIMARY }}>Rite</span>
      </span>
    </div>
  );
}

export default function LandingNavbar({ onSignIn, onGetStarted, onHome = () => {}, onNavFeature = () => {}, activeFeature = null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [featOpen, setFeatOpen] = useState(false);

  const linkStyle = (active) => ({ fontFamily: 'Manrope, sans-serif', fontWeight: 500, fontSize: 14, color: active ? '#c4b5fd' : '#fff', background: 'none', border: 'none', cursor: 'pointer' });

  return (
    <>
      <nav style={{
        position: 'relative', zIndex: 20, width: '100%',
        padding: '16px 48px',
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
        background: 'transparent',
      }}
        className="px-6 md:px-[120px]"
      >
        {/* Logo */}
        <div style={{ gridColumn: 1, justifySelf: 'start' }}>
          <Logo />
        </div>

        {/* Desktop center links — main features as direct hyperlinks + More */}
        <div className="hidden md:flex items-center gap-7" style={{ gridColumn: 2 }}>
          <button onClick={onHome} className="hover:opacity-80 transition-opacity" style={linkStyle(activeFeature === null)}>
            Home
          </button>

          {MAIN_FEATURES.map((k) => (
            <button key={k} onClick={() => onNavFeature(k)} className="hover:opacity-80 transition-opacity" style={linkStyle(activeFeature === k)}>
              {FEATURES[k].label}
            </button>
          ))}

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setFeatOpen(o => !o)}
              className="flex items-center gap-1 hover:opacity-80 transition-opacity"
              style={linkStyle(MORE_FEATURES.includes(activeFeature))}
            >
              More
              <ChevronDown size={14} style={{ transform: featOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
            </button>

            {featOpen && (
              <>
                <div onClick={() => setFeatOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                <div style={{
                  position: 'absolute', top: 'calc(100% + 12px)', right: 0, zIndex: 50, width: 290,
                  background: 'rgba(12,10,24,0.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(123,57,252,0.25)', borderRadius: 14, padding: 8, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                }}>
                  {MORE_FEATURES.map((k) => {
                    const f = FEATURES[k]; const I = f.navIcon; const active = activeFeature === k;
                    return (
                      <button key={k} onClick={() => { onNavFeature(k); setFeatOpen(false); }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: active ? 'rgba(123,57,252,0.16)' : 'transparent', textAlign: 'left', transition: 'background .15s' }}
                        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(123,57,252,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <I size={15} color="#c4b5fd" />
                        </div>
                        <div>
                          <div style={{ fontFamily: 'Manrope', fontSize: 13.5, fontWeight: 600, color: '#fff' }}>{f.label}</div>
                          <div style={{ fontFamily: 'Manrope', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{f.eyebrow}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: single Sign In (desktop) + hamburger (mobile) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gridColumn: 3 }}>
          <button
            onClick={onSignIn}
            className="hidden md:inline-flex"
            style={{
              fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: 14,
              color: '#171717', background: '#ffffff',
              border: '1px solid #d4d4d4', borderRadius: 8,
              padding: '9px 20px', cursor: 'pointer', transition: 'opacity .2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Sign In
          </button>

          <button
            className="md:hidden cursor-pointer"
            style={{ background: 'none', border: 'none', color: '#fff' }}
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </nav>

      {/* Mobile full-screen overlay */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: '#000',
            display: 'flex', flexDirection: 'column',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 }}>
            <Logo />
            <button
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
              onClick={() => setMobileOpen(false)}
            >
              <X size={24} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <button
              onClick={() => { setMobileOpen(false); onHome(); }}
              style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: 22, color: activeFeature === null ? '#c4b5fd' : '#fff', background: 'none', border: 'none', padding: '14px 0', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.07)', letterSpacing: '-0.01em' }}
            >
              Home
            </button>
            {FEATURE_ORDER.map((k) => (
              <button
                key={k}
                onClick={() => { setMobileOpen(false); onNavFeature(k); }}
                style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: 22, color: activeFeature === k ? '#c4b5fd' : '#fff', background: 'none', border: 'none', padding: '14px 0', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.07)', letterSpacing: '-0.01em' }}
              >
                {FEATURES[k].label}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button
              onClick={() => { setMobileOpen(false); onSignIn(); }}
              style={{
                fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: 16,
                color: '#171717', background: '#fff',
                border: '1px solid #d4d4d4', borderRadius: 10,
                padding: '14px', cursor: 'pointer',
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMobileOpen(false); onGetStarted(); }}
              style={{
                fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: 16,
                color: '#fafafa', background: PRIMARY,
                border: 'none', borderRadius: 10,
                padding: '14px', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(123,57,252,0.4)',
              }}
            >
              Get Started Free
            </button>
          </div>
        </div>
      )}
    </>
  );
}
