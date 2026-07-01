import { useState } from 'react';
import { User, Mail, Lock, Bell, Shield, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { api } from '../../utils/api.js';
import LegalModal from '../Legal/LegalModal.jsx';

const PURPLE = '#7b39fc';

// ── Reusable form field ─────────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontFamily: 'Manrope', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

// ── Status messages ─────────────────────────────────────────────────────────
function StatusMsg({ type, children }) {
  const isError = type === 'error';
  return (
    <div style={{
      padding: '9px 14px', borderRadius: 8, fontSize: 12, fontFamily: 'Manrope',
      background: isError ? 'rgba(255,77,109,0.08)' : 'rgba(0,212,170,0.08)',
      border: `1px solid ${isError ? 'rgba(255,77,109,0.25)' : 'rgba(0,212,170,0.25)'}`,
      color: isError ? '#ff4d6d' : '#00d4aa',
      display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12,
    }}>
      {isError ? <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> : <CheckCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />}
      {children}
    </div>
  );
}

// ── Section card ─────────────────────────────────────────────────────────────
function Section({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="p-card" style={{ padding: '22px 24px', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(123,57,252,0.15)', border: '1px solid rgba(123,57,252,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={16} color={PURPLE} />
        </div>
        <div>
          <div style={{ fontFamily: 'Manrope', fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>{title}</div>
          {subtitle && <div style={{ fontFamily: 'Manrope', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{subtitle}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Code input (6 digits) ─────────────────────────────────────────────────
function CodeInput({ value, onChange, disabled }) {
  return (
    <input
      value={value} onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      disabled={disabled} placeholder="000000" maxLength={6}
      style={{ fontFamily: 'monospace', fontSize: 22, letterSpacing: '0.25em', textAlign: 'center', padding: '12px', borderRadius: 10, background: 'rgba(123,57,252,0.08)', border: '1px solid rgba(123,57,252,0.3)', color: '#c4b5fd', width: '100%' }}
    />
  );
}

function PurpleBtn({ children, onClick, disabled, loading, sm }) {
  return (
    <button onClick={onClick} disabled={disabled || loading}
      className="btn-purple" style={{ padding: sm ? '7px 16px' : '9px 20px', fontSize: sm ? 12 : 13, opacity: (disabled || loading) ? 0.45 : 1 }}>
      {loading ? '…' : children}
    </button>
  );
}

function GhostBtn({ children, onClick, disabled, sm }) {
  return (
    <button onClick={onClick} disabled={disabled} className="btn-ghost" style={{ padding: sm ? '6px 14px' : '8px 18px', fontSize: sm ? 11 : 12 }}>
      {children}
    </button>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, changeName, changePassword, changeEmail, resetPassword, resendVerification } = useAuth();

  // Name
  const [name, setName]       = useState(user?.name || '');
  const [nameStatus, setNameStatus] = useState(null);
  const [savingName, setSavingName] = useState(false);

  // Password change
  const [curPwd, setCurPwd]   = useState('');
  const [newPwd, setNewPwd]   = useState('');
  const [confirmPwd, setConfirm] = useState('');
  const [pwdStatus, setPwdStatus] = useState(null);
  const [savingPwd, setSavingPwd] = useState(false);

  // Email change
  const [newEmail, setNewEmail] = useState('');
  const [emailPwd, setEmailPwd] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailStep, setEmailStep] = useState('form'); // 'form' | 'verify'
  const [emailStatus, setEmailStatus] = useState(null);
  const [savingEmail, setSavingEmail] = useState(false);

  // Legal modal
  const [legal, setLegal] = useState(null);

  // Forgot password
  const [resetEmail, setResetEmail] = useState(user?.email || '');
  const [resetCode, setResetCode]   = useState('');
  const [resetStep, setResetStep]   = useState('form'); // 'form' | 'verify' | 'done'
  const [resetStatus, setResetStatus] = useState(null);
  const [sendingReset, setSendingReset] = useState(false);

  // ── Name change ────────────────────────────────────────────────────────
  async function handleSaveName() {
    if (!name.trim()) return;
    setSavingName(true); setNameStatus(null);
    try {
      await changeName(name.trim());
      setNameStatus({ type: 'success', msg: 'Display name updated.' });
    } catch (e) {
      setNameStatus({ type: 'error', msg: e.message });
    } finally { setSavingName(false); }
  }

  // ── Password change ────────────────────────────────────────────────────
  async function handleChangePassword() {
    if (newPwd !== confirmPwd) { setPwdStatus({ type: 'error', msg: 'New passwords do not match.' }); return; }
    if (newPwd.length < 6) { setPwdStatus({ type: 'error', msg: 'Password must be at least 6 characters.' }); return; }
    setSavingPwd(true); setPwdStatus(null);
    try {
      await changePassword(curPwd, newPwd);
      setPwdStatus({ type: 'success', msg: 'Password changed successfully.' });
      setCurPwd(''); setNewPwd(''); setConfirm('');
    } catch (e) {
      const msg = e.code === 'auth/wrong-password' ? 'Current password is incorrect.' : e.message;
      setPwdStatus({ type: 'error', msg });
    } finally { setSavingPwd(false); }
  }

  // ── Email change — step 1: request code ───────────────────────────────
  async function handleRequestEmailCode() {
    if (!newEmail || !emailPwd) return;
    setSavingEmail(true); setEmailStatus(null);
    try {
      await api.email.requestEmailChange(newEmail);
      setEmailStep('verify');
      setEmailStatus({ type: 'success', msg: `Verification code sent to ${newEmail}.` });
    } catch (e) {
      setEmailStatus({ type: 'error', msg: e.message });
    } finally { setSavingEmail(false); }
  }

  // ── Email change — step 2: verify code + change ────────────────────────
  async function handleVerifyEmailChange() {
    if (emailCode.length !== 6) return;
    setSavingEmail(true); setEmailStatus(null);
    try {
      const res = await api.email.verifyEmailChange(newEmail, emailCode);
      if (!res.valid) throw new Error('Invalid or expired code.');
      await changeEmail(emailPwd, newEmail);
      setEmailStatus({ type: 'success', msg: 'Email address updated successfully.' });
      setEmailStep('form'); setNewEmail(''); setEmailPwd(''); setEmailCode('');
    } catch (e) {
      setEmailStatus({ type: 'error', msg: e.message });
    } finally { setSavingEmail(false); }
  }

  // ── Forgot password — step 1: request code ────────────────────────────
  async function handleRequestResetCode() {
    if (!resetEmail) return;
    setSendingReset(true); setResetStatus(null);
    try {
      await resetPassword(resetEmail);
      setResetStep('verify');
      setResetStatus({ type: 'success', msg: `A 6-digit code and a reset link were sent to ${resetEmail}.` });
    } catch (e) {
      setResetStatus({ type: 'error', msg: e.message });
    } finally { setSendingReset(false); }
  }

  // ── Forgot password — step 2: verify code ────────────────────────────
  async function handleVerifyResetCode() {
    if (resetCode.length !== 6) return;
    setSendingReset(true); setResetStatus(null);
    try {
      const res = await api.email.verifyResetCode(resetEmail, resetCode);
      if (!res.valid) throw new Error('Invalid or expired code.');
      setResetStep('done');
      setResetStatus({ type: 'success', msg: 'Code verified. Use the link sent to your email to set a new password, or re-login with your updated credentials.' });
    } catch (e) {
      setResetStatus({ type: 'error', msg: e.message });
    } finally { setSendingReset(false); }
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 700, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #7b39fc, #5b21b6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: 'Cabin', flexShrink: 0 }}>
            {(user?.name || user?.email || '?').slice(0, 1).toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 24, fontWeight: 400, color: '#fff', letterSpacing: '-0.02em' }}>
              {user?.name || 'Your Profile'}
            </h1>
            <p style={{ fontFamily: 'Manrope', fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
              {user?.email}
              {user?.emailVerified
                ? <span style={{ color: '#00d4aa', marginLeft: 8 }}>✓ Verified</span>
                : <span style={{ color: '#ffd166', marginLeft: 8 }}>Unverified — check your inbox</span>}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          {!user?.emailVerified && (
            <button onClick={resendVerification} className="btn-ghost" style={{ fontSize: 11 }}>
              Resend verification email
            </button>
          )}
          <button
            onClick={() => {
              try { Object.keys(localStorage).filter(k => k.startsWith(`ir_fw_${user?.id}_`)).forEach(k => localStorage.removeItem(k)); } catch { /* ignore */ }
              window.dispatchEvent(new Event('investrite:start-tour'));
            }}
            className="btn-ghost" style={{ fontSize: 11 }}>
            ↻ Replay tour &amp; feature tips
          </button>
        </div>
      </div>

      {/* ── Display Name ─────────────────────────────────────────────────── */}
      <Section icon={User} title="Display Name" subtitle="Shown in the top-right of the app">
        {nameStatus && <StatusMsg type={nameStatus.type}>{nameStatus.msg}</StatusMsg>}
        <Field label="Username">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. jsmith"
            onKeyDown={e => e.key === 'Enter' && handleSaveName()} />
        </Field>
        <PurpleBtn onClick={handleSaveName} loading={savingName} disabled={!name.trim() || name === user?.name}>
          Save Name
        </PurpleBtn>
      </Section>

      {/* ── Change Password ───────────────────────────────────────────────── */}
      <Section icon={Lock} title="Change Password" subtitle="Requires your current password">
        {pwdStatus && <StatusMsg type={pwdStatus.type}>{pwdStatus.msg}</StatusMsg>}
        <Field label="Current Password">
          <input type="password" value={curPwd} onChange={e => setCurPwd(e.target.value)} placeholder="••••••••" />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="New Password">
            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="min 6 chars" />
          </Field>
          <Field label="Confirm New Password">
            <input type="password" value={confirmPwd} onChange={e => setConfirm(e.target.value)} placeholder="repeat password" />
          </Field>
        </div>
        <PurpleBtn onClick={handleChangePassword} loading={savingPwd} disabled={!curPwd || !newPwd || !confirmPwd}>
          Update Password
        </PurpleBtn>
      </Section>

      {/* ── Change Email ──────────────────────────────────────────────────── */}
      <Section icon={Mail} title="Change Email" subtitle="A verification code will be sent to your new address">
        {emailStatus && <StatusMsg type={emailStatus.type}>{emailStatus.msg}</StatusMsg>}
        {emailStep === 'form' ? (
          <>
            <Field label="New Email Address">
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="new@example.com" />
            </Field>
            <Field label="Current Password (to confirm)">
              <input type="password" value={emailPwd} onChange={e => setEmailPwd(e.target.value)} placeholder="••••••••" />
            </Field>
            <PurpleBtn onClick={handleRequestEmailCode} loading={savingEmail} disabled={!newEmail || !emailPwd}>
              Send Verification Code
            </PurpleBtn>
          </>
        ) : (
          <>
            <p style={{ fontFamily: 'Manrope', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>
              Enter the 6-digit code sent to <strong style={{ color: '#c4b5fd' }}>{newEmail}</strong>
            </p>
            <Field label="Verification Code">
              <CodeInput value={emailCode} onChange={setEmailCode} disabled={savingEmail} />
            </Field>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <PurpleBtn onClick={handleVerifyEmailChange} loading={savingEmail} disabled={emailCode.length !== 6}>
                Confirm Change
              </PurpleBtn>
              <GhostBtn onClick={() => { setEmailStep('form'); setEmailCode(''); setEmailStatus(null); }}>
                Back
              </GhostBtn>
            </div>
          </>
        )}
      </Section>

      {/* ── Forgot / Reset Password ───────────────────────────────────────── */}
      <Section icon={Shield} title="Forgot Password" subtitle="Get a reset code by email — works even when logged out">
        {resetStatus && <StatusMsg type={resetStatus.type}>{resetStatus.msg}</StatusMsg>}
        {resetStep === 'form' && (
          <>
            <Field label="Email Address">
              <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="you@example.com" />
            </Field>
            <PurpleBtn onClick={handleRequestResetCode} loading={sendingReset} disabled={!resetEmail}>
              Send Reset Code
            </PurpleBtn>
          </>
        )}
        {resetStep === 'verify' && (
          <>
            <p style={{ fontFamily: 'Manrope', fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>
              Enter the 6-digit code sent to <strong style={{ color: '#c4b5fd' }}>{resetEmail}</strong>
            </p>
            <Field label="Reset Code">
              <CodeInput value={resetCode} onChange={setResetCode} disabled={sendingReset} />
            </Field>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <PurpleBtn onClick={handleVerifyResetCode} loading={sendingReset} disabled={resetCode.length !== 6}>
                Verify Code
              </PurpleBtn>
              <GhostBtn onClick={() => { setResetStep('form'); setResetCode(''); setResetStatus(null); }}>
                Back
              </GhostBtn>
            </div>
          </>
        )}
        {resetStep === 'done' && (
          <GhostBtn onClick={() => { setResetStep('form'); setResetCode(''); setResetStatus(null); }}>
            Send another code
          </GhostBtn>
        )}
      </Section>

      {/* ── Email notifications info ──────────────────────────────────────── */}
      <Section icon={Bell} title="Email Notifications" subtitle="Automatic alerts sent to your account email">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Welcome email',       when: 'On account creation', enabled: true },
            { label: 'Login alert',         when: 'On every new sign-in (device + time)', enabled: true },
            { label: 'Email change code',   when: 'When you request an email change', enabled: true },
            { label: 'Password reset code', when: 'When you request a password reset', enabled: true },
          ].map(({ label, when, enabled }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div style={{ fontFamily: 'Manrope', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{label}</div>
                <div style={{ fontFamily: 'Manrope', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{when}</div>
              </div>
              <span style={{ fontFamily: 'Cabin', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 5, background: enabled ? 'rgba(0,212,170,0.1)' : 'rgba(255,255,255,0.05)', color: enabled ? '#00d4aa' : 'rgba(255,255,255,0.3)', border: enabled ? '1px solid rgba(0,212,170,0.2)' : '1px solid rgba(255,255,255,0.07)' }}>
                {enabled ? 'Active' : 'Off'}
              </span>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: 'Manrope', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 14, lineHeight: 1.5 }}>
          Email sending requires SMTP credentials in <code style={{ fontFamily: 'monospace', color: '#a78bfa' }}>backend/.env</code>.
          Set <code style={{ fontFamily: 'monospace', color: '#a78bfa' }}>GMAIL_USER</code> and <code style={{ fontFamily: 'monospace', color: '#a78bfa' }}>GMAIL_APP_PASSWORD</code> to activate.
        </p>
      </Section>

      {/* ── Legal & Privacy ──────────────────────────────────────────────── */}
      <Section icon={FileText} title="Legal & Privacy" subtitle="Terms, data handling, and how to delete your account">
        <p style={{ fontFamily: 'Manrope', fontSize: 12.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, marginBottom: 14 }}>
          InvestRite is a free, non-commercial hobby project by <strong style={{ color: '#c4b5fd' }}>Akshat Barjatya</strong>. It makes no money, is not a financial adviser, and provides no investment advice — all content is educational only. Your data is never sold. To delete your account and all associated data, email <a href="mailto:akshat.barjatya@gmail.com" style={{ color: '#a78bfa' }}>akshat.barjatya@gmail.com</a>.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <GhostBtn onClick={() => setLegal('terms')}>View Terms &amp; Conditions</GhostBtn>
          <GhostBtn onClick={() => setLegal('privacy')}>View Privacy Notice</GhostBtn>
        </div>
      </Section>

      <LegalModal doc={legal} onClose={() => setLegal(null)} />
    </div>
  );
}
