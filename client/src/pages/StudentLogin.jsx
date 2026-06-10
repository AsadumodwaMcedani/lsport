import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';

export default function StudentLogin({ onLogin }) {
  const [courses, setCourses]     = useState([]);
  const [form, setForm]           = useState({ student_number: '', course_id: '', password: '' });
  const [err, setErr]             = useState('');
  const [busy, setBusy]           = useState(false);
  const [showPw, setShowPw]       = useState(false);
  const [mounted, setMounted]     = useState(false);

  useEffect(() => {
    api('/courses/active').then(setCourses).catch(() => {});
    setTimeout(() => setMounted(true), 50);
  }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const { forcePasswordChange } = await api('/auth/student/login', { method: 'POST', body: { ...form, course_id: parseInt(form.course_id) } });
      const me = await api('/auth/me');
      onLogin({ ...me, forcePasswordChange });
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  }

  return (
    <div style={s.page}>
      <div style={s.bg} />
      <div style={{ ...s.card, opacity: mounted ? 1 : 0, transform: mounted ? 'none' : 'translateY(16px)', transition: 'opacity 0.4s ease, transform 0.4s ease' }}>
        <div style={s.brand}>
          <img src="/lsport-white.png" alt="LS Port" style={s.logoImg} />
        </div>
        <hr style={s.divider} />
        <h2 style={s.heading}>Student Sign In</h2>
        <p style={s.sub}>Use your student number and course to access the portal</p>

        {err && <div style={s.errorBox}><ErrIcon /> {err}</div>}

        <form onSubmit={submit} noValidate style={{ marginTop: 18 }}>
          <div style={s.field}>
            <label style={s.label}>Student Number</label>
            <input style={s.input} type="text" placeholder="e.g. 201900123" value={form.student_number} onChange={set('student_number')} autoComplete="username" required />
          </div>
          <div style={s.field}>
            <label style={s.label}>Course</label>
            <select style={s.input} value={form.course_id} onChange={set('course_id')} required>
              <option value="">— Select your course —</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name} ({c.year} S{c.semester_number})</option>)}
            </select>
          </div>
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <div style={{ position: 'relative' }}>
              <input style={{ ...s.input, paddingRight: 44 }} type={showPw ? 'text' : 'password'} placeholder="Enter your password" value={form.password} onChange={set('password')} autoComplete="current-password" required />
              <button type="button" style={s.eyeBtn} onClick={() => setShowPw(v => !v)} tabIndex={-1}><EyeIcon open={showPw} /></button>
            </div>
          </div>
          <p style={s.hint}>First time? Your initial password is the <strong>last 5 digits</strong> of your student number.</p>
          <button style={s.submitBtn} disabled={busy}>
            {busy ? <><Spinner /> Signing in…</> : <>Sign in <ArrowIcon /></>}
          </button>
        </form>

        <p style={s.forgot}>Forgot password? Contact your lecturer.</p>
        <p style={s.footer}>Private portal &mdash; contact your lecturer for access</p>
      </div>
    </div>
  );
}

function ErrIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>; }
function EyeIcon({ open }) {
  return open
    ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function ArrowIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>; }
function Spinner() { return <span style={{ display: 'inline-block', width: 15, height: 15, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />; }

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: '#0f172a', position: 'relative', overflow: 'hidden' },
  bg:   { position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 55% 45% at 30% 25%, rgba(250,121,33,0.14) 0%, transparent 60%), radial-gradient(ellipse 45% 55% at 80% 80%, rgba(29,78,216,0.10) 0%, transparent 55%)' },
  card: { position: 'relative', zIndex: 1, background: '#fff', borderRadius: 20, boxShadow: '0 20px 80px rgba(0,0,0,0.4)', padding: '40px 44px', width: '100%', maxWidth: 440 },
  brand:    { display: 'flex', alignItems: 'center' },
  logoImg:  { height: 44, width: 'auto', objectFit: 'contain' },
  divider:  { border: 'none', borderTop: '1px solid #f0f0f0', margin: '22px 0 18px' },
  heading:  { fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: '1.3rem', color: '#1F2937', marginBottom: 4 },
  sub:      { color: '#9ca3af', fontSize: '0.86rem', margin: 0 },
  errorBox: { display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: 8, padding: '10px 14px', fontSize: '0.85rem', marginTop: 14 },
  field:    { marginBottom: 16 },
  label:    { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 },
  input:    { display: 'block', width: '100%', padding: '11px 13px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.92rem', color: '#1F2937', background: '#fafafa', boxSizing: 'border-box', fontFamily: 'inherit' },
  eyeBtn:   { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' },
  hint:     { fontSize: '0.8rem', color: '#9ca3af', margin: '-4px 0 16px', lineHeight: 1.5 },
  submitBtn:{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 13, background: 'linear-gradient(90deg,#FA7921,#e06010)', color: '#fff', border: 'none', borderRadius: 10, fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: '0.96rem', cursor: 'pointer', boxShadow: '0 4px 18px rgba(250,121,33,0.4)' },
  forgot:   { textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem', marginTop: 20, marginBottom: 0 },
  footer:   { textAlign: 'center', color: '#d1d5db', fontSize: '0.7rem', marginTop: 10, marginBottom: 0 },
};
