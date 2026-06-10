import React, { useEffect, useState } from 'react';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import StudentLogin from './pages/StudentLogin.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import { api } from './lib/api.js';

// Surface detection: work.* or admin.* or localhost without ?portal=student = admin
// portal.* or ?portal=student = student portal
const params = new URLSearchParams(location.search);
const isStudent =
  location.hostname.startsWith('portal') ||
  params.get('portal') === 'student';
const isAdmin = !isStudent && (
  location.hostname.startsWith('work') ||
  location.hostname.startsWith('admin') ||
  location.hostname === 'localhost' ||
  location.hostname === '127.0.0.1'
);

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = checking session

  useEffect(() => {
    api('/auth/me').then(setUser).catch(() => setUser(null));
  }, []);

  if (user === undefined) return null;

  if (isAdmin) {
    return user
      ? <AdminDashboard user={user} onLogout={() => setUser(null)} />
      : <AdminLogin onLogin={setUser} />;
  }

  if (isStudent) {
    return user?.role === 'student'
      ? <StudentDashboard user={user} onLogout={() => setUser(null)} />
      : <StudentLogin onLogin={setUser} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0f172a', color: '#94a3b8', fontFamily: 'sans-serif' }}>
      <p>Unknown portal surface.</p>
    </div>
  );
}
