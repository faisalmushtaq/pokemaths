/**
 * POKÉMATHS — email access for cloud sync
 *
 * Google sign-in can't complete inside an installed Home Screen app (see
 * isStandaloneApp in lib/cloud), so the same account can also be reached with
 * an email + "app password":
 *   - AppPasswordSetup: shown to a signed-in player; links a password to the
 *     current (Google) account, keeping one account and one set of saves.
 *   - EmailSignIn: signs in with an email + password, or creates a new
 *     email-only account; Google is never needed. No popup, no redirect.
 */

import { useState, type CSSProperties, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import { PIXEL_FONT } from '@/lib/gameConstants';
import {
  createEmailAccount,
  friendlyAuthError,
  hasAppPassword,
  sendPasswordReset,
  setAppPassword,
  signInEmail,
} from '@/lib/cloud';

const TEXT_SMALL = 'clamp(0.38rem, 1.7vw, 0.5rem)';
const TEXT_TINY = 'clamp(0.34rem, 1.4vw, 0.44rem)';
const TEXT_BTN = 'clamp(0.42rem, 2vw, 0.62rem)';

// 16px keeps iOS Safari from zooming the page when the field is focused.
const inputStyle: CSSProperties = {
  width: '100%',
  fontSize: 16,
  padding: '0.6rem 0.75rem',
  borderRadius: 8,
  background: 'rgba(0,0,0,0.55)',
  color: '#fff',
  border: '2px solid rgba(56,189,248,0.55)',
  outline: 'none',
};

const noteStyle: CSSProperties = {
  fontFamily: PIXEL_FONT,
  fontSize: TEXT_TINY,
  color: '#888',
  textAlign: 'center',
  lineHeight: 1.8,
};

function primaryButton(color: string): CSSProperties {
  return {
    fontFamily: PIXEL_FONT,
    fontSize: TEXT_BTN,
    padding: '0.7rem 0',
    width: '100%',
    borderRadius: 8,
    background: color,
    color: '#0a0a1a',
    border: `2px solid ${color}`,
    cursor: 'pointer',
  };
}

const linkButton: CSSProperties = {
  fontFamily: PIXEL_FONT,
  fontSize: TEXT_TINY,
  color: '#38bdf8',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '0.25rem',
  lineHeight: 1.7,
};

function Message({ tone, children }: { tone: 'error' | 'ok'; children: string }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      style={{ fontFamily: PIXEL_FONT, fontSize: TEXT_TINY, color: tone === 'error' ? '#ef4444' : '#22c55e', textAlign: 'center', lineHeight: 1.7 }}
    >
      {children}
    </div>
  );
}

export function EmailSignIn({ initiallyOpen = false }: { initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const [mode, setMode] = useState<'signIn' | 'create'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} style={linkButton}>
        OR USE EMAIL + PASSWORD (NO GOOGLE NEEDED)
      </button>
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === 'create') await createEmailAccount(email, password);
      else await signInEmail(email, password);
      // useAuthUser() picks up the new user and starts syncing.
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    setError(null);
    setNotice(null);
    if (!email.trim()) {
      setError('ENTER YOUR EMAIL FIRST, THEN TAP FORGOT PASSWORD.');
      return;
    }
    try {
      await sendPasswordReset(email);
      setNotice('IF THAT EMAIL HAS AN ACCOUNT, A RESET LINK IS ON ITS WAY.');
    } catch (err) {
      setError(friendlyAuthError(err));
    }
  };

  const switchMode = (next: 'signIn' | 'create') => {
    setMode(next);
    setError(null);
    setNotice(null);
  };
  const tab = (value: 'signIn' | 'create', label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === value}
      onClick={() => switchMode(value)}
      style={{
        flex: 1,
        fontFamily: PIXEL_FONT,
        fontSize: TEXT_TINY,
        padding: '0.55rem 0.25rem',
        borderRadius: 6,
        cursor: 'pointer',
        color: mode === value ? '#0a0a1a' : '#38bdf8',
        background: mode === value ? '#38bdf8' : 'transparent',
        border: '2px solid #38bdf8',
      }}
    >
      {label}
    </button>
  );

  return (
    <form onSubmit={submit} className="w-full flex flex-col items-center" style={{ gap: 8, maxWidth: '18rem', flexShrink: 0 }}>
      <div role="tablist" aria-label="Email account" className="w-full flex" style={{ gap: 6 }}>
        {tab('signIn', 'SIGN IN')}
        {tab('create', 'NEW ACCOUNT')}
      </div>
      <input
        type="email"
        inputMode="email"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="Email"
        aria-label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        style={inputStyle}
      />
      <input
        type="password"
        autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
        placeholder={mode === 'create' ? 'New password (6+ characters)' : 'Password'}
        aria-label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={6}
        required
        style={inputStyle}
      />
      <button type="submit" disabled={busy} style={{ ...primaryButton('#38bdf8'), opacity: busy ? 0.6 : 1 }}>
        {busy ? 'PLEASE WAIT…' : mode === 'create' ? 'CREATE ACCOUNT' : 'SIGN IN'}
      </button>
      {error && <Message tone="error">{error}</Message>}
      {notice && <Message tone="ok">{notice}</Message>}
      {mode === 'signIn' && (
        <button type="button" onClick={forgot} style={linkButton}>FORGOT PASSWORD?</button>
      )}
      <div style={noteStyle}>
        {mode === 'create'
          ? 'ANY EMAIL WORKS, NO GOOGLE NEEDED. SIGN IN WITH THE SAME EMAIL + PASSWORD ON EVERY DEVICE TO SYNC.'
          : 'ALREADY SYNCING WITH GOOGLE? SET A PASSWORD FOR THAT ACCOUNT ON THE WEBSITE FIRST, THEN SIGN IN HERE WITH IT.'}
      </div>
    </form>
  );
}

export function AppPasswordSetup({ user }: { user: User }) {
  const [hasPassword, setHasPassword] = useState(() => hasAppPassword(user));
  // Email-only accounts already sign in with their password everywhere.
  const emailOnly = user.providerData.every((provider) => provider.providerId === 'password');
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!user.email) return null;

  if (!open) {
    return (
      <div className="w-full flex flex-col items-center" style={{ gap: 4 }}>
        {notice && <Message tone="ok">{notice}</Message>}
        <button type="button" onClick={() => { setOpen(true); setNotice(null); }} style={linkButton}>
          {emailOnly ? 'CHANGE PASSWORD' : hasPassword ? 'CHANGE APP PASSWORD' : 'USING THE HOME SCREEN APP? SET APP PASSWORD'}
        </button>
      </div>
    );
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await setAppPassword(password);
      setHasPassword(true);
      setPassword('');
      setOpen(false);
      setNotice(emailOnly
        ? 'PASSWORD CHANGED. USE THE NEW ONE ON YOUR OTHER DEVICES.'
        : `APP PASSWORD SAVED. IN THE HOME SCREEN APP, SIGN IN WITH ${user.email!.toUpperCase()} + THIS PASSWORD.`);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="w-full flex flex-col items-center" style={{ gap: 8, maxWidth: '18rem', flexShrink: 0 }}>
      {!emailOnly && (
        <div style={noteStyle}>
          GOOGLE SIGN-IN CAN'T FINISH INSIDE A HOME SCREEN APP. SET A PASSWORD HERE, THEN SIGN IN THERE WITH THIS EMAIL + PASSWORD. SAME ACCOUNT, SAME SAVES.
        </div>
      )}
      {/* Hidden username lets password managers save the pair together. */}
      <input type="email" autoComplete="username" value={user.email} readOnly hidden />
      <input
        type="password"
        autoComplete="new-password"
        placeholder={emailOnly ? 'New password (6+ characters)' : 'New app password (6+ characters)'}
        aria-label="New password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={6}
        required
        style={inputStyle}
      />
      <button type="submit" disabled={busy} style={{ ...primaryButton('#22c55e'), opacity: busy ? 0.6 : 1 }}>
        {busy ? 'SAVING…' : emailOnly ? 'SAVE NEW PASSWORD' : 'SAVE APP PASSWORD'}
      </button>
      {error && <Message tone="error">{error}</Message>}
      <button type="button" onClick={() => { setOpen(false); setError(null); }} style={linkButton}>CANCEL</button>
    </form>
  );
}
