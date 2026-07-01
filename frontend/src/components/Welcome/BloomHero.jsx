import React from 'react';
import {
  Sparkles, Download, Wand2, BookOpen,
  ArrowRight, Menu, Globe, Share2, Link,
} from 'lucide-react';
import './bloom.css';

const VIDEO_URL =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4';

/* ── Small reusable atoms ─────────────────────────────────────────────────── */

function IconBox({ children }) {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      background: 'rgba(255,255,255,0.1)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {children}
    </div>
  );
}

/* ── Component ────────────────────────────────────────────────────────────── */

export default function BloomHero({ onGetStarted, onSignIn }) {
  return (
    <div className="bloom-page" style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>

      {/* ── Background video ───────────────────────────────────────────── */}
      <video
        autoPlay loop muted playsInline
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }}
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>

      {/* Dark scrim so glass elements read cleanly */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1 }} />

      {/* ── Two-panel split ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 10 }}>

        {/* ══ LEFT PANEL ═══════════════════════════════════════════════ */}
        <div style={{ width: '52%', minHeight: '100vh', position: 'relative', flex: '0 0 52%' }}
             className="bloom-left-panel">

          {/* Liquid-glass overlay card */}
          <div
            className="liquid-glass-strong bloom-left-overlay"
            style={{
              position: 'absolute', inset: 16,
              borderRadius: 24,
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* ── Nav ───────────────────────────────────────────────── */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '20px 24px', flexShrink: 0,
            }}>
              {/* Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.5))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, color: '#000', letterSpacing: '-0.03em',
                }}>
                  IR
                </div>
                <span style={{ fontWeight: 600, fontSize: '1.25rem', letterSpacing: '-0.04em', color: 'white' }}>
                  InvestRite
                </span>
              </div>

              {/* Menu pill */}
              <button
                className="liquid-glass bloom-interactive"
                style={{
                  borderRadius: 9999, padding: '8px 16px', background: 'none', border: 'none',
                  display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.8)',
                  fontSize: '0.8rem', fontWeight: 500, fontFamily: 'Poppins, sans-serif',
                }}
              >
                <Menu size={15} />
                Menu
              </button>
            </div>

            {/* ── Hero center ───────────────────────────────────────── */}
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '32px 40px', textAlign: 'center', gap: 0,
            }}>
              {/* Logo mark large */}
              <div style={{
                width: 80, height: 80, borderRadius: 20, marginBottom: 32,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.25), rgba(255,255,255,0.08))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 800, color: 'white', letterSpacing: '-0.04em',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.25)',
              }}>
                IR
              </div>

              {/* H1 */}
              <h1 style={{
                fontSize: 'clamp(2.6rem, 4.5vw, 4.5rem)',
                fontWeight: 500,
                letterSpacing: '-0.05em',
                lineHeight: 1.05,
                color: 'white',
                marginBottom: 32,
              }}>
                Track Where the<br />
                <em className="bloom-serif" style={{ color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', fontSize: '1.05em' }}>
                  Big Money
                </em>{' '}
                Moves
              </h1>

              {/* Primary CTA */}
              <button
                onClick={onGetStarted}
                className="liquid-glass-strong bloom-interactive"
                style={{
                  borderRadius: 9999, padding: '13px 26px', background: 'none', border: 'none',
                  display: 'flex', alignItems: 'center', gap: 12,
                  color: 'white', fontSize: '0.9rem', fontWeight: 500,
                  fontFamily: 'Poppins, sans-serif', marginBottom: 10,
                }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Download size={13} />
                </span>
                Start Screening Free
              </button>

              {/* Secondary sign-in link */}
              <button
                onClick={onSignIn}
                style={{
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)',
                  fontSize: '0.75rem', fontFamily: 'Poppins, sans-serif', cursor: 'pointer',
                  marginBottom: 28, transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.75)'}
                onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.45)'}
              >
                Already have an account? Sign in
              </button>

              {/* Feature pills */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                {['Flow Screener', 'Trade Plans', 'Portfolio'].map((label) => (
                  <span
                    key={label}
                    className="liquid-glass"
                    style={{
                      borderRadius: 9999, padding: '6px 16px',
                      fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)',
                      fontWeight: 400,
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Bottom quote ──────────────────────────────────────── */}
            <div style={{
              padding: '20px 28px', flexShrink: 0,
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{
                fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)', marginBottom: 8,
              }}>
                Institutional Intelligence
              </div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', marginBottom: 10, lineHeight: 1.5 }}>
                "Follow the flow.{' '}
                <em className="bloom-serif">
                  The market always shows its hand.
                </em>"
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.15)' }} />
                <span style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                  InvestRite
                </span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.15)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* ══ RIGHT PANEL ══════════════════════════════════════════════ */}
        <div
          className="bloom-right-panel"
          style={{
            width: '48%', flex: '0 0 48%', minHeight: '100vh',
            flexDirection: 'column',
            padding: '20px 20px 20px 8px',
          }}
        >
          {/* ── Top bar ───────────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            {/* Social icon strip */}
            <div
              className="liquid-glass"
              style={{
                borderRadius: 9999, display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px',
              }}
            >
              {[Globe, Share2, Link].map((Icon, i) => (
                <button key={i} className="bloom-social-icon" style={{ width: 28, height: 28 }}>
                  <Icon size={13} />
                </button>
              ))}
              <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />
              <ArrowRight size={13} color="rgba(255,255,255,0.4)" />
            </div>

            {/* Account button */}
            <button
              onClick={onSignIn}
              className="liquid-glass bloom-interactive"
              style={{
                borderRadius: 9999, padding: '8px 16px', background: 'none', border: 'none',
                display: 'flex', alignItems: 'center', gap: 6,
                color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem', fontWeight: 500,
                fontFamily: 'Poppins, sans-serif',
              }}
            >
              <Sparkles size={13} />
              Account
            </button>
          </div>

          {/* ── Community card ────────────────────────────────────── */}
          <div
            className="liquid-glass"
            style={{ borderRadius: 16, padding: '14px 16px', width: 220, marginBottom: 16 }}
          >
            <div style={{ fontSize: '0.78rem', fontWeight: 500, marginBottom: 6 }}>
              Join the platform
            </div>
            <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
              Screen mid-cap institutional flow with precision filters.
            </div>
          </div>

          {/* ── Feature section (mt-auto) ─────────────────────────── */}
          <div style={{ marginTop: 'auto' }}>
            <div
              className="liquid-glass"
              style={{ borderRadius: 40, padding: 12 }}
            >
              {/* Two side-by-side cards */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                {[
                  { Icon: Wand2, title: 'Flow Analysis', desc: 'IV rank & premium' },
                  { Icon: BookOpen, title: 'Trade Archive', desc: 'Historical setups' },
                ].map(({ Icon, title, desc }) => (
                  <div
                    key={title}
                    className="liquid-glass"
                    style={{ flex: 1, borderRadius: 24, padding: '18px 16px' }}
                  >
                    <IconBox><Icon size={15} color="rgba(255,255,255,0.75)" /></IconBox>
                    <div style={{ marginTop: 14, fontSize: '0.78rem', fontWeight: 500, marginBottom: 4 }}>
                      {title}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)' }}>
                      {desc}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom feature card */}
              <div
                className="liquid-glass"
                style={{ borderRadius: 24, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}
              >
                {/* Thumbnail */}
                <div style={{
                  width: 96, height: 64, borderRadius: 12, flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Sparkles size={16} color="rgba(255,255,255,0.6)" />
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 500, marginBottom: 4 }}>
                    Options Screener
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
                    Mid-cap US equities · $1B–$10B market cap
                  </div>
                </div>

                <button
                  onClick={onGetStarted}
                  className="liquid-glass bloom-interactive"
                  style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(255,255,255,0.12)', border: 'none',
                    color: 'white', fontSize: '1rem', lineHeight: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Poppins, sans-serif', cursor: 'pointer',
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile full-width: make left 100% */}
        <style>{`
          @media (max-width: 1023px) {
            .bloom-left-panel { width: 100% !important; flex: 0 0 100% !important; }
          }
        `}</style>
      </div>

      {/* ── Disclaimer footer ──────────────────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 10,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '16px 24px',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(8px)',
      }}>
        <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 1.6, maxWidth: 800, margin: '0 auto' }}>
          <strong style={{ color: 'rgba(255,255,255,0.5)' }}>Educational use only.</strong>{' '}
          InvestRite is a demonstration platform. All data is sourced from Yahoo Finance and is not investment advice.
          Options trading involves a high degree of risk and is not suitable for all investors.
          InvestRite is not registered with the SEC, FINRA, or any state securities authority.
        </p>
      </div>
    </div>
  );
}
