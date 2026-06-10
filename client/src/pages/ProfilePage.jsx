import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';

export default function ProfilePage() {
  const [form, setForm]     = useState({ full_name: '', surname: '', whatsapp: '', official_email: '', personal_email: '' });
  const [busy, setBusy]     = useState(false);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved]   = useState(false);
  const [err, setErr]       = useState('');

  useEffect(() => {
    api('/admin/profile')
      .then(data => setForm(f => ({ ...f, ...data })))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault(); setErr(''); setSaved(false); setBusy(true);
    try {
      await api('/admin/profile', { method: 'POST', body: form });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.heading}>Profile &amp; Contact Details</h2>
        <p style={s.sub}>Stored securely. Used for system-generated PDF headers and email signatures.</p>
      </div>

      {loading ? <Skeleton /> : (
        <form onSubmit={submit} style={s.card}>
          {err   && <div style={s.error}>{err}</div>}
          {saved && <div style={s.success}>✓ Profile saved</div>}

          <div style={s.section}>Personal</div>
          <div style={s.grid}>
            <Field label="Full Name"><input style={s.input} value={form.full_name} onChange={set('full_name')} placeholder="e.g. Akhona" /></Field>
            <Field label="Surname"><input style={s.input} value={form.surname} onChange={set('surname')} placeholder="e.g. Mcedani" /></Field>
          </div>

          <div style={s.section}>Contact</div>
          <div style={s.grid}>
            <Field label="Official Email (UFH)"><input style={s.input} type="email" value={form.official_email} onChange={set('official_email')} placeholder="yourname@ufh.ac.za" /></Field>
            <Field label="Personal Email"><input style={s.input} type="email" value={form.personal_email} onChange={set('personal_email')} placeholder="yourname@gmail.com" /></Field>
            <Field label="WhatsApp Number">
              <input style={s.input} type="tel" value={form.whatsapp} onChange={set('whatsapp')} placeholder="+27 82 000 0000" />
            </Field>
          </div>

          <div style={s.actions}>
            <button style={s.btn} disabled={busy}>{busy ? 'Saving…' : 'Save Profile'}</button>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  );
}

function Skeleton() {
  return (
    <div style={s.card}>
      {[...Array(4)].map((_, i) => <div key={i} style={{ ...s.skRow, animationDelay: `${i * 0.08}s` }} />)}
    </div>
  );
}

const s = {
  page:    { animation: 'fadeUp 0.3s ease', maxWidth: 700 },
  header:  { marginBottom: 24 },
  heading: { fontFamily: "'Poppins',sans-serif", fontSize: '1.1rem', fontWeight: 700, color: '#1F2937', marginBottom: 4 },
  sub:     { color: '#9ca3af', fontSize: '0.85rem', margin: 0 },
  card:    { background: '#fff', borderRadius: 14, padding: '28px 32px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' },
  section: { fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14, marginTop: 4, paddingBottom: 6, borderBottom: '1px solid #f0f0f0' },
  grid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px', marginBottom: 24 },
  label:   { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 },
  input:   { display: 'block', width: '100%', padding: '10px 13px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', color: '#1F2937', background: '#fafafa', boxSizing: 'border-box', fontFamily: 'inherit' },
  actions: { display: 'flex', justifyContent: 'flex-end', marginTop: 8 },
  btn:     { background: '#FA7921', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: "'Poppins',sans-serif" },
  error:   { background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: 8, padding: '10px 14px', fontSize: '0.85rem', marginBottom: 16 },
  success: { background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', borderRadius: 8, padding: '10px 14px', fontSize: '0.85rem', marginBottom: 16 },
  skRow:   { height: 44, background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)', borderRadius: 8, marginBottom: 12, animation: 'shimmer 1.5s infinite' },
};
