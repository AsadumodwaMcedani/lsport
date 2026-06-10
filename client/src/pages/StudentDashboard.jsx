import React, { useState } from 'react';
import { api } from '../lib/api.js';
import StudentQueriesPage from './StudentQueriesPage.jsx';

export default function StudentDashboard({ user, onLogout, onUserUpdate }) {
  const [page, setPage] = useState('home');
  if (user.forcePasswordChange) return <ChangePassword user={user} onDone={onUserUpdate} />;
  if (!user.hasConsented)       return <ComplianceScreen user={user} onDone={onUserUpdate} />;
  if (page === 'queries')       return <StudentQueriesPage user={user} onBack={() => setPage('home')} />;
  return <Dashboard user={user} onLogout={onLogout} onNavigate={setPage} />;
}

/* ── Main dashboard ── */
function Dashboard({ user, onLogout, onNavigate }) {
  const displayName = user.name; // already "Surname, Names" from /me

  return (
    <div style={s.page}>
      <header style={s.topbar}>
        <div style={s.brand}>
          <img src="/lsport-white.png" alt="LS Port" style={s.logoImg} />
        </div>
        <div style={s.topRight}>
          <span style={s.userName}>{displayName}</span>
          <button style={s.logoutBtn} onClick={async () => { await api('/auth/logout', { method: 'POST' }); onLogout(); }}>Sign out</button>
        </div>
      </header>

      <main style={s.main}>
        <div style={s.banner}>
          <div>
            <h1 style={s.bannerTitle}>Good {greeting()}, {user.names?.split(' ')[0] || user.name?.split(',')[0]}</h1>
            <p style={s.bannerSub}>Welcome to your student portal.</p>
          </div>
          <div style={s.bannerDecor} />
        </div>

        <div style={s.grid}>
          <Widget icon="💬" label="My Queries" value="—" sub="Submit or track your queries" color="#3b82f6" onClick={() => onNavigate('queries')} />
          <Widget icon="📢" label="Announcements" value="—" sub="Latest notices from your lecturer" color="#FA7921" />
        </div>

        <div style={s.actionCard}>
          <div style={s.actionIcon}>📝</div>
          <div style={s.actionText}>
            <div style={s.actionTitle}>Submit a Query</div>
            <div style={s.actionSub}>Have a question about marks, submissions, or course content? Submit it here.</div>
          </div>
          <button style={s.orangeBtn} onClick={() => onNavigate('queries')}>Submit Query</button>
        </div>
      </main>
    </div>
  );
}

/* ── Change password screen ── */
function ChangePassword({ user, onDone }) {
  const [pw, setPw]     = useState('');
  const [pw2, setPw2]   = useState('');
  const [err, setErr]   = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (pw !== pw2) return setErr('Passwords do not match');
    if (pw.length < 8) return setErr('Minimum 8 characters');
    setBusy(true); setErr('');
    try {
      await api('/auth/student/change-password', { method: 'POST', body: { new_password: pw } });
      const me = await api('/auth/me');
      onDone(me);
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  }

  return (
    <div style={s.fullPage}>
      <div style={s.centreCard}>
        <img src="/lsport-white.png" alt="LS Port" style={{ height: 40, marginBottom: 20 }} />
        <div style={s.alertBox}>🔐 You must set a new password before continuing.</div>
        <h2 style={s.cardTitle}>Create Your Password</h2>
        <p style={s.cardSub}>Choose a secure password. Minimum 8 characters.</p>
        {err && <div style={s.errorBox}>{err}</div>}
        <form onSubmit={submit}>
          <label style={s.label}>New Password</label>
          <input style={s.input} type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="At least 8 characters" required autoFocus />
          <label style={s.label}>Confirm Password</label>
          <input style={s.input} type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Repeat password" required />
          <button style={s.orangeBtn} disabled={busy}>{busy ? 'Saving…' : 'Set Password & Continue →'}</button>
        </form>
      </div>
    </div>
  );
}

/* ── Compliance / consent screen ── */
function ComplianceScreen({ user, onDone }) {
  const [terms, setTerms]   = useState(false);
  const [popia, setPopia]   = useState(false);
  const [err, setErr]       = useState('');
  const [busy, setBusy]     = useState(false);

  async function proceed() {
    if (!terms || !popia) return setErr('You must accept both the Terms and Conditions and the POPIA consent to continue.');
    setErr(''); setBusy(true);
    try {
      await api('/auth/student/consent', { method: 'POST', body: { terms_accepted: true, popia_accepted: true } });
      const me = await api('/auth/me');
      onDone(me);
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  }

  return (
    <div style={s.fullPage}>
      <div style={{ ...s.centreCard, maxWidth: 520 }}>
        <img src="/lsport-white.png" alt="LS Port" style={{ height: 40, marginBottom: 20 }} />
        <h2 style={s.cardTitle}>Before you continue</h2>
        <p style={s.cardSub}>Please read and accept the following before accessing your portal.</p>

        <div style={s.consentBox}>
          <h4 style={s.consentTitle}>Terms and Conditions</h4>
          <p style={s.consentText}>
            This portal is provided for academic purposes by the LBBS lecturer. You agree to use it responsibly, not share your login credentials, and accept that your activity may be logged for administrative purposes.
          </p>
          <label style={s.checkLabel}>
            <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} style={s.checkbox} />
            <span>I have read and accept the <strong>Terms and Conditions</strong></span>
          </label>
        </div>

        <div style={s.consentBox}>
          <h4 style={s.consentTitle}>POPIA Consent</h4>
          <p style={s.consentText}>
            Your personal information (name, student number, contact details) is collected and stored in accordance with the Protection of Personal Information Act (POPIA). It is used solely for academic administration and will not be shared with third parties without your consent. Data is retained for 13 months and then permanently deleted.
          </p>
          <label style={s.checkLabel}>
            <input type="checkbox" checked={popia} onChange={e => setPopia(e.target.checked)} style={s.checkbox} />
            <span>I have read and consent to the <strong>POPIA Data Processing Statement</strong></span>
          </label>
        </div>

        {err && <div style={s.errorBox}>{err}</div>}

        <button style={{ ...s.orangeBtn, marginTop: 8, opacity: busy ? 0.7 : 1 }} onClick={proceed} disabled={busy}>
          {busy ? 'Confirming…' : 'Accept & Enter Portal →'}
        </button>
      </div>
    </div>
  );
}

/* ── Shared small components ── */
function Widget({ icon, label, value, sub, color, onClick }) {
  return (
    <div style={{ ...s.widget, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <div style={{ ...s.widgetDot, background: color }} />
      <div style={s.widgetIcon}>{icon}</div>
      <div style={s.widgetValue}>{value}</div>
      <div style={s.widgetLabel}>{label}</div>
      <div style={s.widgetSub}>{sub}</div>
    </div>
  );
}
function InfoIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>; }

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

const s = {
  page:       { minHeight: '100vh', background: '#f4f5f7', display: 'flex', flexDirection: 'column', fontFamily: "'Open Sans',sans-serif" },
  topbar:     { background: '#0f172a', padding: '0 28px', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  brand:      { display: 'flex', alignItems: 'center' },
  logoImg:    { height: 30, width: 'auto', objectFit: 'contain' },
  topRight:   { display: 'flex', alignItems: 'center', gap: 16 },
  userName:   { color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 },
  logoutBtn:  { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8', borderRadius: 7, padding: '6px 14px', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' },
  main:       { flex: 1, padding: '28px', maxWidth: 860, width: '100%', margin: '0 auto', boxSizing: 'border-box' },
  banner:     { background: 'linear-gradient(120deg,#1F2937 0%,#0f172a 60%,#3b1f00 100%)', borderRadius: 16, padding: '28px 32px', marginBottom: 24, position: 'relative', overflow: 'hidden' },
  bannerTitle:{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: '1.25rem', color: '#fff', margin: '0 0 4px' },
  bannerSub:  { color: 'rgba(255,255,255,0.65)', margin: 0, fontSize: '0.88rem' },
  bannerDecor:{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle,rgba(250,121,33,0.22) 0%,transparent 70%)', pointerEvents: 'none' },
  grid:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginBottom: 20 },
  widget:     { background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.07)' },
  widgetDot:  { width: 8, height: 8, borderRadius: '50%', marginBottom: 12 },
  widgetIcon: { fontSize: '1.4rem', marginBottom: 6 },
  widgetValue:{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: '1.8rem', color: '#1F2937', lineHeight: 1 },
  widgetLabel:{ fontWeight: 700, fontSize: '0.85rem', color: '#1F2937', margin: '6px 0 2px' },
  widgetSub:  { fontSize: '0.78rem', color: '#9ca3af' },
  actionCard: { background: '#fff', borderRadius: 14, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', marginBottom: 16 },
  actionIcon: { fontSize: '2rem', flexShrink: 0 },
  actionText: { flex: 1 },
  actionTitle:{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: '0.95rem', color: '#1F2937', marginBottom: 2 },
  actionSub:  { fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.4 },
  orangeBtn:  { display: 'block', width: '100%', background: 'linear-gradient(90deg,#FA7921,#e06010)', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 20px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', fontFamily: "'Poppins',sans-serif", textAlign: 'center' },
  noticeCard: { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 },

  // shared full-page layout
  fullPage:   { minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  centreCard: { background: '#fff', borderRadius: 20, padding: '40px 44px', width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' },
  alertBox:   { background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: '10px 14px', fontSize: '0.85rem', color: '#713f12', marginBottom: 18 },
  cardTitle:  { fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: '1.2rem', color: '#1F2937', margin: '0 0 4px' },
  cardSub:    { color: '#9ca3af', fontSize: '0.86rem', margin: '0 0 20px' },
  label:      { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 },
  input:      { display: 'block', width: '100%', padding: '11px 13px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.92rem', color: '#1F2937', background: '#fafafa', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 14 },
  errorBox:   { background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: 8, padding: '10px 14px', fontSize: '0.85rem', marginBottom: 14 },

  // compliance
  consentBox:   { background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 18px', marginBottom: 14 },
  consentTitle: { fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: '0.9rem', color: '#1F2937', margin: '0 0 8px' },
  consentText:  { fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.6, margin: '0 0 12px' },
  checkLabel:   { display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.88rem', color: '#374151', cursor: 'pointer' },
  checkbox:     { marginTop: 2, width: 16, height: 16, accentColor: '#FA7921', flexShrink: 0 },
};
