import { useState } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import LegalModal from '../Legal/LegalModal.jsx';
import AuthShell from './AuthShell.jsx';
import { Field, GlassInput, PasswordInput, PrimaryBtn, AuthHeading, linkBtn } from './authUI.jsx';

const FIREBASE_ERRORS = {
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/invalid-email':        'Please enter a valid email address.',
  'auth/weak-password':        'Password must be at least 6 characters.',
  'auth/too-many-requests':    'Too many attempts. Try again later.',
};

export default function RegisterForm({ onSuccess, onBack, onSwitchToLogin }) {
  const { register } = useAuth();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed]     = useState(false);
  const [legal, setLegal]       = useState(null);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!agreed) { setError('Please agree to the Terms & Conditions and Privacy Policy to continue.'); return; }
    setError('');
    setLoading(true);
    try { await register(name, email, password); onSuccess(); }
    catch (err) { setError(FIREBASE_ERRORS[err.code] || err.message); }
    finally { setLoading(false); }
  }

  return (
    <AuthShell>
      <button onClick={onBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontFamily: 'Manrope', fontSize: 13, cursor: 'pointer', marginBottom: 22 }}
        onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
        <ArrowLeft size={15} /> Back
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 26 }}>
        <TrendingUp size={20} color="#fff" />
        <span style={{ fontFamily: 'Manrope', fontWeight: 700, fontSize: 18, color: '#fff', letterSpacing: '-0.02em' }}>
          Invest<span style={{ color: '#7b39fc' }}>Rite</span>
        </span>
      </div>

      <motion.div key="register" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
        <AuthHeading title="Create account" subtitle="Free access · no card required." />

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
          <Field label="Username">
            <GlassInput value={name} onChange={e => setName(e.target.value)} placeholder="e.g. jsmith" required autoFocus />
          </Field>
          <Field label="Email">
            <GlassInput type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </Field>
          <Field label="Password">
            <PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="min 6 characters" minLength={6} required />
          </Field>

          {/* Disclaimer */}
          <div style={{ background: 'rgba(255,209,102,0.05)', border: '1px solid rgba(255,209,102,0.15)', borderRadius: 14, padding: '12px 15px', fontSize: 11, lineHeight: 1.6, color: 'rgba(255,209,102,0.8)', fontFamily: 'Manrope' }}>
            <span style={{ fontWeight: 700 }}>Educational hobby project.</span> InvestRite is a free, non-commercial project by Akshat Barjatya — not a financial adviser. Nothing here is investment advice; trading involves substantial risk of loss.
          </div>

          {/* Agreement */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
            <input id="agree-terms" type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              style={{ width: 16, height: 16, marginTop: 2, borderRadius: 3, accentColor: '#7b39fc', flexShrink: 0, cursor: 'pointer' }} />
            <label htmlFor="agree-terms" style={{ textTransform: 'none', letterSpacing: 'normal', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontFamily: 'Manrope', lineHeight: 1.6, cursor: 'pointer', margin: 0 }}>
              I have read and agree to the{' '}
              <button type="button" onClick={(e) => { e.preventDefault(); setLegal('terms'); }} style={{ ...linkBtn, fontSize: 12, textDecoration: 'underline', textUnderlineOffset: 2 }}>Terms &amp; Conditions</button>
              {' '}and{' '}
              <button type="button" onClick={(e) => { e.preventDefault(); setLegal('privacy'); }} style={{ ...linkBtn, fontSize: 12, textDecoration: 'underline', textUnderlineOffset: 2 }}>Privacy Policy</button>.
            </label>
          </div>

          {error && <p style={{ fontSize: 12, fontFamily: 'Manrope', color: '#ff4d6d' }}>{error}</p>}

          <PrimaryBtn type="submit" disabled={loading || !agreed} style={{ opacity: (loading || !agreed) ? 0.5 : 1 }}>
            {loading ? 'Creating account…' : 'Create Free Account'}
          </PrimaryBtn>
        </form>

        <p style={{ textAlign: 'center', marginTop: 22, fontFamily: 'Manrope', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          Already have an account?{' '}
          <button onClick={onSwitchToLogin} style={{ ...linkBtn, fontSize: 13 }}>Sign in</button>
        </p>
      </motion.div>

      <LegalModal doc={legal} onClose={() => setLegal(null)} />
    </AuthShell>
  );
}
