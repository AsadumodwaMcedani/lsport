import React, { useEffect, useState } from 'react';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import { api } from './lib/api.js';

// Hostname decides surface: work.* = admin, portal.* = student/tutor (Phase 2+)
const isAdmin = location.hostname.startsWith('work') || location.hostname.startsWith('admin') || location.hostname === 'localhost';

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = checking
  useEffect(() => { api('/auth/me').then(setUser).catch(() => setUser(null)); }, []);
  if (user === undefined) return null;
  if (!isAdmin) return <Shell><div className="card"><h2>Student portal</h2><p>Coming in Phase 2.</p></div></Shell>;
  return user ? <AdminDashboard user={user} onLogout={() => setUser(null)} /> : <AdminLogin onLogin={setUser} />;
}

export function Shell({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div className="logo" style={{ textAlign: 'center', marginBottom: 16 }}><span className="ls">LS </span><span className="port">PORT</span></div>
        {children}
      </div>
    </div>
  );
}
