import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TrendingUp, ArrowLeft, Check } from 'lucide-react';
import { setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from '../../firebase.js';
import { useAuth } from '../../hooks/useAuth.js';
import LegalModal from '../Legal/LegalModal.jsx';
import AuthShell from './AuthShell.jsx';
import { Field, GlassInput, PasswordInput, PrimaryBtn, AuthHeading, linkBtn } from './authUI.jsx';

const FIREBASE_ERRORS = {
  'auth/invalid-credential':  'Invalid email or password.',
  'auth/user-not-found':      'No account with this email.',
  'auth/wrong-password':      'Incorrect password.',
  'auth/too-many-requests':   'Too many attempts. Try again later.',
  'auth/invalid-email':       'Please enter a valid email.',
};

function StatusMsg({ type, children }) {
  return (
    <div style={{
      padding: '9px 13px', borderRadius: 10, fontSize: 12, fontFamily: 'Manrope',
      background: type === 'error' ? 'rgba(255,77,109,0.08)' : 'rgba(0,212,170,0.08)',
      border: `1px solid ${type === 'error' ? 'rgba(255,77,109,0.25)' : 'rgba(0,212,170,0.25)'}`,
      color: type === 'error' ? '#ff4d6d' : '#00d4aa',
    }}>
      {children}
    </div>
  );
}

/* ── Forgot password sub-flow ─────────────────────────────────────────────── */
function ForgotPassword({ onBack }) {
  const { resetPassword } = useAuth();
  const [email, setEmail]     = useState('');
  const [code, setCode]       = useState('');
  const [step, setStep]       = useState('email'); // 'email' | 'code' | 'done'
  const [status, setStatus]   = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSendCode(e) {
    e.preventDefault();
    setLoading(true); setStatus(null);
    try {
      await resetPassword(email);
      setStep('code');
      setStatus({ type: 'success', msg: `A 6-digit code and a reset link were sent to ${email}. Check your inbox (and spam).` });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    } finally { setLoading(false); }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    if (code.length !== 6) return;
    setLoading(true); setStatus(null);
    try {
      const res = await fetch('/api/email/verify-reset-code', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) throw new Error(data.error || 'Invalid or expired code.');
      setStep('done');
      setStatus({ type: 'success', msg: 'Code verified! Use the reset link in your email to set a new password, then sign in.' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.message });
    } finally { setLoading(false); }
  }

  return (
    <motion.div key="forgot" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
      <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 13, fontFamily: 'Manrope', marginBottom: 18 }}>
        <ArrowLeft size={14} /> Back to sign in
      </button>

      <AuthHeading title="Reset password" subtitle="We'll email you a reset link and a 6-digit code." />

      {status && <div style={{ marginBottom: 14 }}><StatusMsg type={status.type}>{status.msg}</StatusMsg></div>}

      {step === 'email' && (
        <form onSubmit={handleSendCode} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Email Address">
            <GlassInput type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </Field>
          <PrimaryBtn type="submit" disabled={loading || !email} style={{ opacity: (loading || !email) ? 0.5 : 1 }}>
            {loading ? 'Sending…' : 'Send reset code'}
          </PrimaryBtn>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="6-digit code">
            <input type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} autoFocus
              style={{ fontFamily: 'monospace', fontSize: 24, letterSpacing: '0.25em', textAlign: 'center', padding: '12px', background: 'rgba(123,57,252,0.08)', border: '1px solid rgba(123,57,252,0.3)', borderRadius: 14, color: '#c4b5fd' }} />
          </Field>
          <PrimaryBtn type="submit" disabled={loading || code.length !== 6} style={{ opacity: (loading || code.length !== 6) ? 0.5 : 1 }}>
            {loading ? 'Verifying…' : 'Verify code'}
          </PrimaryBtn>
          <button type="button" onClick={() => { setStep('email'); setCode(''); setStatus(null); }} style={{ ...linkBtn, fontSize: 12.5, alignSelf: 'center' }}>Resend code</button>
        </form>
      )}

      {step === 'done' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '12px 0' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,212,170,0.12)', border: '1px solid rgba(0,212,170,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={22} color="#00d4aa" />
          </div>
          <button onClick={onBack} style={{ ...linkBtn, fontSize: 13 }}>Back to sign in</button>
        </div>
      )}
    </motion.div>
  );
}

/* ── Main login ───────────────────────────────────────────────────────────── */
export default function LoginForm({ onSuccess, onBack, onSwitchToRegister }) {
  const { login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [legal, setLegal]       = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence).catch(() => {});
      await login(email, password);
      onSuccess();
    } catch (err) {
      setError(FIREBASE_ERRORS[err.code] || err.message);
    } finally { setLoading(false); }
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

      <AnimatePresence mode="wait">
        {showForgot ? (
          <ForgotPassword key="forgot" onBack={() => setShowForgot(false)} />
        ) : (
          <motion.div key="login" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.22 }}>
            <AuthHeading title="Welcome back" subtitle="Sign in to continue to your dashboard." />

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Email Address">
                <GlassInput type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
              </Field>
              <Field label="Password">
                <PasswordInput value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" required />
              </Field>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', fontFamily: 'Manrope', fontSize: 12.5, color: 'rgba(255,255,255,0.6)', textTransform: 'none', letterSpacing: 'normal', margin: 0 }}>
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ width: 15, height: 15, accentColor: '#7b39fc', cursor: 'pointer' }} />
                  Keep me signed in
                </label>
                <button type="button" onClick={() => setShowForgot(true)} style={{ ...linkBtn, fontSize: 12.5 }}>Reset password</button>
              </div>

              {error && <StatusMsg type="error">{error}</StatusMsg>}

              <PrimaryBtn type="submit" disabled={loading} style={{ opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Signing in…' : 'Sign In'}
              </PrimaryBtn>
            </form>

            <p style={{ textAlign: 'center', marginTop: 22, fontFamily: 'Manrope', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              New to InvestRite?{' '}
              <button onClick={onSwitchToRegister} style={{ ...linkBtn, fontSize: 13 }}>Create account</button>
            </p>

            <p style={{ textAlign: 'center', marginTop: 14, fontFamily: 'Manrope', fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
              By continuing you agree to our{' '}
              <button type="button" onClick={() => setLegal('terms')} style={{ ...linkBtn, fontSize: 11 }}>Terms</button>
              {' '}&amp;{' '}
              <button type="button" onClick={() => setLegal('privacy')} style={{ ...linkBtn, fontSize: 11 }}>Privacy</button>.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <LegalModal doc={legal} onClose={() => setLegal(null)} />
    </AuthShell>
  );
}
