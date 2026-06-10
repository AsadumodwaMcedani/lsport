import React, { useState } from 'react';
import { api } from '../lib/api.js';
import { Shell } from '../App.jsx';

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      await api('/auth/admin/login', { method: 'POST', body: { email, password } });
      onLogin(await api('/auth/me'));
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  }

  return (
    <Shell>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Admin Login</h2>
        {err && <div className="error">{err}</div>}
        <form onSubmit={submit}>
          <input className="input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button className="btn" disabled={busy} style={{ width: '100%' }}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </div>
    </Shell>
  );
}
