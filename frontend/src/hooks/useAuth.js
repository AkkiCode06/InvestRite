import { useState, useEffect, useCallback } from 'react';
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile,
  sendEmailVerification, sendPasswordResetEmail,
  updatePassword, updateEmail, reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import { auth } from '../firebase.js';
import { api } from '../utils/api.js';

function uidToSeed(uid) {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) hash = Math.imul(31, hash) + uid.charCodeAt(i) | 0;
  return Math.abs(hash);
}

export function useAuth() {
  const [user, setUser]           = useState(null);
  const [sessionSeed, setSessionSeed] = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    localStorage.removeItem('ir_token');
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUser((prev) => ({
          id: fbUser.uid,
          name: fbUser.displayName || (prev?.id === fbUser.uid ? prev?.name : null) || fbUser.email,
          email: fbUser.email,
          emailVerified: fbUser.emailVerified,
        }));
        setSessionSeed(uidToSeed(fbUser.uid));
      } else {
        setUser(null);
        setSessionSeed(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (name, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await cred.user.reload();
    // Firebase: send verification email
    await sendEmailVerification(cred.user).catch(() => {});
    // Backend: send welcome email (authenticated — token is now valid)
    api.email.welcome().catch(() => {});
    const u = { id: cred.user.uid, name, email, emailVerified: false };
    // Flag a first-run so the onboarding tour auto-starts on the dashboard.
    // Also mark the dashboard welcome seen — the tour already introduces it.
    try {
      localStorage.setItem('ir_onboard_pending', cred.user.uid);
      localStorage.setItem(`ir_fw_${cred.user.uid}_dashboard`, '1');
    } catch { /* ignore */ }
    setUser(u);
    setSessionSeed(uidToSeed(cred.user.uid));
    return u;
  }, []);

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const u = { id: cred.user.uid, name: cred.user.displayName || email, email, emailVerified: cred.user.emailVerified };
    setUser(u);
    setSessionSeed(uidToSeed(cred.user.uid));
    // Backend: send login alert (fire and forget)
    api.email.loginAlert({
      userAgent: navigator.userAgent,
      ip: null, // IP resolved server-side
    }).catch(() => {});
    return u;
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(() => signOut(auth), []);

  // ── Re-authenticate (required before sensitive changes) ───────────────────
  const reauthenticate = useCallback(async (currentPassword) => {
    const fbUser = auth.currentUser;
    if (!fbUser) throw new Error('Not logged in');
    const cred = EmailAuthProvider.credential(fbUser.email, currentPassword);
    await reauthenticateWithCredential(fbUser, cred);
  }, []);

  // ── Change display name ───────────────────────────────────────────────────
  const changeName = useCallback(async (name) => {
    await updateProfile(auth.currentUser, { displayName: name });
    setUser(prev => ({ ...prev, name }));
  }, []);

  // ── Change password (requires reauth) ─────────────────────────────────────
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    await reauthenticate(currentPassword);
    await updatePassword(auth.currentUser, newPassword);
  }, [reauthenticate]);

  // ── Change email (requires reauth + backend code verify) ─────────────────
  const changeEmail = useCallback(async (currentPassword, newEmail) => {
    await reauthenticate(currentPassword);
    await updateEmail(auth.currentUser, newEmail);
    setUser(prev => ({ ...prev, email: newEmail }));
  }, [reauthenticate]);

  // ── Send password reset email (unauthenticated) ───────────────────────────
  const resetPassword = useCallback(async (email) => {
    // Use both: Firebase link-based reset + our code-based reset
    await sendPasswordResetEmail(auth, email);
    await api.email.requestPasswordReset(email).catch(() => {});
  }, []);

  // ── Resend verification email ─────────────────────────────────────────────
  const resendVerification = useCallback(async () => {
    if (auth.currentUser) await sendEmailVerification(auth.currentUser);
  }, []);

  return {
    user, sessionSeed, loading,
    login, register, logout,
    reauthenticate, changeName, changePassword, changeEmail,
    resetPassword, resendVerification,
  };
}
