import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/* Shared building blocks for the split-screen auth screens.
   Adapted from a shadcn template → plain JSX + Tailwind v4 + InvestRite theme. */

export const linkBtn = {
  background: 'none', border: 'none', padding: 0,
  color: '#a78bfa', fontFamily: 'Manrope, sans-serif', fontWeight: 600, cursor: 'pointer',
};

const inputBase = {
  width: '100%', background: 'transparent', border: 'none', outline: 'none',
  fontFamily: 'Manrope, sans-serif', fontSize: 14, color: '#fff', padding: '13px 15px',
};

const wrapClass =
  'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10';

export function Field({ label, children }) {
  return (
    <div>
      <label style={{ fontFamily: 'Manrope, sans-serif', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 7, textTransform: 'none', letterSpacing: 'normal' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function GlassInput({ style, ...props }) {
  return (
    <div className={wrapClass}>
      <input {...props} style={{ ...inputBase, ...style }} />
    </div>
  );
}

export function PasswordInput({ style, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div className={wrapClass}>
      <div style={{ position: 'relative' }}>
        <input {...props} type={show ? 'text' : 'password'} style={{ ...inputBase, paddingRight: 46, ...style }} />
        <button
          type="button" tabIndex={-1} onClick={() => setShow(s => !s)}
          style={{ position: 'absolute', top: 0, bottom: 0, right: 12, display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export function PrimaryBtn({ children, style, disabled, ...rest }) {
  return (
    <button
      {...rest} disabled={disabled}
      style={{ width: '100%', borderRadius: 16, background: '#7b39fc', color: '#fff', border: 'none', padding: '14px', fontFamily: 'Cabin, sans-serif', fontSize: 15, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'opacity .2s', ...style }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '0.88'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = style?.opacity ?? '1'; }}
    >
      {children}
    </button>
  );
}

export function AuthHeading({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h1 style={{ fontFamily: "'Instrument Serif', serif", fontWeight: 400, fontSize: 'clamp(30px, 4vw, 40px)', color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        {title}
      </h1>
      {subtitle && <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: 13.5, color: 'rgba(255,255,255,0.45)', marginTop: 8 }}>{subtitle}</p>}
    </div>
  );
}
