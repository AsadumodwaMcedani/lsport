import React from 'react';
import { api } from '../lib/api.js';

const navItems = ['Dashboard', 'Queries', 'Students', 'Courses', 'Announcements', 'Tasks', 'Meetings', 'Research', 'Consulting', 'Departmental', 'Supervision', 'Lab', 'Vehicles', 'Tutors', 'Staff', 'Goals', 'Reports', 'Settings'];

export default function AdminDashboard({ user, onLogout }) {
  async function logout() { await api('/auth/logout', { method: 'POST' }); onLogout(); }
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 220, background: '#111827', padding: 16 }}>
        <div className="logo" style={{ marginBottom: 24 }}><span className="ls">LS </span><span className="port">PORT</span></div>
        {navItems.map(i => (
          <div key={i} style={{ padding: '8px 10px', borderRadius: 6, cursor: 'pointer', color: i === 'Dashboard' ? 'var(--color-action)' : 'var(--color-text-on-dark)' }}>{i}</div>
        ))}
      </aside>
      <main style={{ flex: 1, padding: 24 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <div>Welcome, {user.name} &nbsp;<button className="btn" onClick={logout}>Logout</button></div>
        </header>
        <div className="card"><h3 style={{ marginTop: 0 }}>Phase 1 shell</h3><p>Query summaries, today's tasks, recent activity and module overview widgets arrive with Phases 2–3.</p></div>
      </main>
    </div>
  );
}
