import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';

export default function AdminLogin({ onLogin }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr]           = useState('');
  const [busy, setBusy]         = useState(false);
  const [showPw, setShowPw]     = useState(false);
  const [mounted, setMounted]   = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      await api('/auth/admin/login', { method: 'POST', body: { email, password } });
      onLogin(await api('/auth/me'));
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  }

  return (
    <div style={s.page}>
      <div style={s.bg} />

      <div style={{ ...s.card, opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.45s ease, transform 0.45s ease' }}>

        {/* brand */}
        <div style={s.brand}>
          <img src="/lsport-white.png" alt="LS Port" style={s.logoImg} />
        </div>

        <div style={s.divider} />

        <h2 style={s.heading}>Welcome back</h2>
        <p style={s.subheading}>Sign in to manage your portal</p>

        {err && (
          <div style={s.errorBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {err}
          </div>
        )}

        <form onSubmit={submit} noValidate style={{ marginTop: 20 }}>
          <Field label="Email address">
            <input
              style={s.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </Field>

          <Field label="Password">
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...s.input, paddingRight: 46 }}
                type={showPw ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button type="button" style={s.eyeBtn} onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                {showPw ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </Field>

          <button style={s.submitBtn} disabled={busy}>
            {busy
              ? <><Spinner /> Signing in…</>
              : <>Sign in <Arrow /></>
            }
          </button>
        </form>

        <p style={s.footer}>Private portal &mdash; contact your lecturer for access</p>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  );
}

function Eye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function EyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}
function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  );
}
function Spinner() {
  return <span style={{ display:'inline-block', width:16, height:16, border:'2px solid rgba(255,255,255,0.35)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />;
}

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    background: '#0f172a',
    position: 'relative',
    overflow: 'hidden',
  },
  bg: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    background: 'radial-gradient(ellipse 60% 50% at 70% 20%, rgba(250,121,33,0.15) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 10% 80%, rgba(255,230,109,0.08) 0%, transparent 55%)',
  },
  card: {
    position: 'relative', zIndex: 1,
    background: '#ffffff',
    borderRadius: 20,
    boxShadow: '0 20px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)',
    padding: '40px 44px',
    width: '100%',
    maxWidth: 430,
  },
  brand: {
    display: 'flex', alignItems: 'center',
    marginBottom: 8,
  },
  logoImg: {
    height: 48,
    width: 'auto',
    objectFit: 'contain',
  },
  divider: {
    height: 1, background: '#f0f0f0',
    margin: '24px 0 20px',
    border: 'none',
  },
  heading: {
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 700,
    fontSize: '1.4rem',
    color: '#1F2937',
    marginBottom: 4,
  },
  subheading: {
    color: '#9ca3af',
    fontSize: '0.88rem',
    margin: 0,
  },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    color: '#b91c1c',
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: '0.85rem',
    marginTop: 16,
  },
  label: {
    display: 'block',
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#374151',
    marginBottom: 7,
    letterSpacing: '0.015em',
  },
  input: {
    display: 'block', width: '100%',
    padding: '12px 14px',
    border: '1.5px solid #e5e7eb',
    borderRadius: 8,
    fontSize: '0.95rem',
    color: '#1F2937',
    background: '#fafafa',
    outline: 'none',
    transition: 'border-color 0.18s, background 0.18s, box-shadow 0.18s',
    boxSizing: 'border-box',
  },
  eyeBtn: {
    position: 'absolute', right: 12, top: '50%',
    transform: 'translateY(-50%)',
    background: 'none', border: 'none',
    padding: 0, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  submitBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%', marginTop: 8,
    padding: '13px',
    background: 'linear-gradient(90deg, #FA7921 0%, #e06010 100%)',
    color: '#fff', border: 'none',
    borderRadius: 10,
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 700,
    fontSize: '0.97rem',
    cursor: 'pointer',
    letterSpacing: '0.02em',
    boxShadow: '0 4px 20px rgba(250,121,33,0.45)',
    transition: 'opacity 0.18s, box-shadow 0.18s',
  },
  footer: {
    textAlign: 'center',
    color: '#c4c4c4',
    fontSize: '0.72rem',
    marginTop: 30,
    marginBottom: 0,
    letterSpacing: '0.02em',
  },
};
