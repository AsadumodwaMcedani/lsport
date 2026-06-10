import React, { useState } from 'react';
import { api } from '../lib/api.js';

const NAV = [
  { group: 'Overview',    items: [{ id: 'Dashboard', icon: <Grid /> }] },
  { group: 'Students',    items: [{ id: 'Queries', icon: <Chat /> }, { id: 'Students', icon: <Users /> }, { id: 'Courses', icon: <Book /> }, { id: 'Announcements', icon: <Bell /> }, { id: 'Tutors', icon: <GradCap /> }] },
  { group: 'Work Diary',  items: [{ id: 'Tasks', icon: <Check /> }, { id: 'Meetings', icon: <Calendar /> }, { id: 'Research', icon: <Flask /> }, { id: 'Consulting', icon: <Brief /> }, { id: 'Departmental', icon: <Building /> }, { id: 'Supervision', icon: <Eye /> }, { id: 'Staff', icon: <Person /> }, { id: 'Goals', icon: <Target /> }] },
  { group: 'Resources',   items: [{ id: 'Lab', icon: <Lab /> }, { id: 'Vehicles', icon: <Car /> }] },
  { group: 'System',      items: [{ id: 'Reports', icon: <BarChart /> }, { id: 'Settings', icon: <Gear /> }] },
];

const STATS = [
  { label: 'Open Queries',     value: '—', color: '#3b82f6', bg: '#eff6ff' },
  { label: 'Students Enrolled',value: '—', color: '#22c55e', bg: '#f0fdf4' },
  { label: 'Tasks Due Today',  value: '—', color: '#FA7921', bg: '#fff7ed' },
  { label: 'Unread Notices',   value: '—', color: '#a855f7', bg: '#faf5ff' },
];

export default function AdminDashboard({ user, onLogout }) {
  const [active, setActive] = useState('Dashboard');

  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    onLogout();
  }

  return (
    <div style={s.shell}>
      {/* ── sidebar ── */}
      <aside style={s.sidebar}>
        <div style={s.sideTop}>
          <div style={s.logoMark}><span style={s.logoL}>L</span></div>
          <div>
            <div style={s.logoText}><span style={s.logoOrange}>LS</span> PORT</div>
            <div style={s.logoSub}>Lecturer Portal</div>
          </div>
        </div>

        <nav style={s.nav}>
          {NAV.map(({ group, items }) => (
            <div key={group} style={s.navGroup}>
              <div style={s.navGroupLabel}>{group}</div>
              {items.map(({ id, icon }) => (
                <button key={id} style={{ ...s.navItem, ...(active === id ? s.navItemActive : {}) }} onClick={() => setActive(id)}>
                  <span style={{ ...s.navIcon, ...(active === id ? s.navIconActive : {}) }}>{icon}</span>
                  {id}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div style={s.sideUser}>
          <div style={s.avatar}>{(user.name || user.email || 'A')[0].toUpperCase()}</div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={s.userName}>{user.name || 'Admin'}</div>
            <div style={s.userEmail}>{user.email}</div>
          </div>
          <button style={s.logoutBtn} onClick={logout} title="Sign out">
            <SignOut />
          </button>
        </div>
      </aside>

      {/* ── main ── */}
      <div style={s.main}>
        {/* topbar */}
        <header style={s.topbar}>
          <div>
            <h1 style={s.pageTitle}>{active}</h1>
            <div style={s.breadcrumb}>Home / {active}</div>
          </div>
          <div style={s.topRight}>
            <div style={s.dateBadge}>{new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        </header>

        {/* content */}
        <div style={s.content}>
          {active === 'Dashboard' && <DashboardHome user={user} />}
          {active !== 'Dashboard' && (
            <div style={s.placeholder}>
              <div style={s.placeholderIcon}>{NAV.flatMap(g => g.items).find(i => i.id === active)?.icon}</div>
              <h3 style={{ color: '#6b7280', fontFamily: "'Poppins',sans-serif", margin: '12px 0 6px' }}>{active}</h3>
              <p style={{ color: '#9ca3af', fontSize: '0.88rem', margin: 0 }}>This section arrives in a later phase.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DashboardHome({ user }) {
  return (
    <div style={{ animation: 'fadeUp 0.35s ease' }}>
      {/* welcome */}
      <div style={s.welcomeCard}>
        <div>
          <h2 style={{ color: '#fff', margin: '0 0 4px', fontFamily: "'Poppins',sans-serif", fontSize: '1.25rem' }}>
            Good {greeting()}, {user.name || 'Lecturer'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', margin: 0, fontSize: '0.88rem' }}>
            Here's your portal overview for today.
          </p>
        </div>
        <div style={s.welcomeDecor} />
      </div>

      {/* stats */}
      <div style={s.statsGrid}>
        {STATS.map(({ label, value, color, bg }) => (
          <div key={label} style={{ ...s.statCard }}>
            <div style={{ ...s.statDot, background: color }} />
            <div style={s.statValue}>{value}</div>
            <div style={s.statLabel}>{label}</div>
            <div style={{ ...s.statAccent, background: bg, borderTop: `3px solid ${color}` }} />
          </div>
        ))}
      </div>

      {/* notice */}
      <div style={s.noticeCard}>
        <div style={s.noticeIcon}><Info /></div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1d4ed8', marginBottom: 2 }}>Phase 1 in progress</div>
          <div style={{ fontSize: '0.84rem', color: '#3b82f6' }}>Live data for queries, students, tasks, and activity will appear here from Phase 2 onwards.</div>
        </div>
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

/* ── nav icons (inline SVG) ── */
function Icon({ d, ...p }) {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d={d}/></svg>;
}
function Grid()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>; }
function Chat()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>; }
function Users()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function Book()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>; }
function Bell()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>; }
function GradCap()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>; }
function Check()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>; }
function Calendar() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function Flask()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6m-3 0v7l-4 8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l-4-8V3"/></svg>; }
function Brief()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>; }
function Building() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function Eye()      { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>; }
function Person()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }
function Target()   { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>; }
function Lab()      { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/><path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/><path d="M9.5 14.5v-5c0-.83-.67-1.5-1.5-1.5S6.5 8.67 6.5 9.5v5"/><path d="M4.5 14H6v1.5c0 .83-.67 1.5-1.5 1.5S3 16.33 3 15.5 3.67 14 4.5 14z"/><path d="M3 20h18"/><path d="M5 20v-6"/><path d="M19 20v-6"/></svg>; }
function Car()      { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>; }
function BarChart() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>; }
function Gear()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>; }
function SignOut()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
function Info()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>; }

/* ── styles ── */
const s = {
  shell: {
    display: 'flex', minHeight: '100vh',
    background: '#f4f5f7',
    fontFamily: "'Open Sans', sans-serif",
  },

  /* sidebar */
  sidebar: {
    width: 240,
    background: '#0f172a',
    display: 'flex', flexDirection: 'column',
    flexShrink: 0,
    overflowY: 'auto',
  },
  sideTop: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '24px 20px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
  },
  logoMark: {
    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
    background: 'linear-gradient(135deg, #FA7921, #e06010)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 3px 10px rgba(250,121,33,0.4)',
  },
  logoL:    { color: '#fff', fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: '1.1rem', lineHeight: 1 },
  logoText: { fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#f1f5f9', letterSpacing: 0.5, lineHeight: 1.1 },
  logoOrange: { color: '#FA7921' },
  logoSub:  { fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2, fontWeight: 600 },

  nav: { flex: 1, padding: '12px 12px 0', overflowY: 'auto' },
  navGroup: { marginBottom: 20 },
  navGroupLabel: {
    fontSize: '0.65rem', fontWeight: 700,
    color: '#475569', letterSpacing: '0.09em',
    textTransform: 'uppercase', padding: '0 8px 6px',
  },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    width: '100%', padding: '8px 10px',
    background: 'none', border: 'none', borderRadius: 8,
    color: '#94a3b8', fontSize: '0.87rem', fontWeight: 500,
    cursor: 'pointer', textAlign: 'left',
    transition: 'background 0.15s, color 0.15s',
    fontFamily: "'Open Sans', sans-serif",
    marginBottom: 2,
  },
  navItemActive: {
    background: 'rgba(250,121,33,0.15)',
    color: '#FA7921',
    fontWeight: 600,
  },
  navIcon: { opacity: 0.6, display: 'flex', alignItems: 'center', flexShrink: 0 },
  navIconActive: { opacity: 1 },

  sideUser: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '14px 16px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
    background: 'rgba(255,255,255,0.03)',
  },
  avatar: {
    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, #FA7921, #7D4600)',
    color: '#fff', fontWeight: 700, fontSize: '0.85rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Poppins',sans-serif",
  },
  userName: { fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userEmail: { fontSize: '0.7rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  logoutBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#64748b', padding: 4, borderRadius: 6, flexShrink: 0,
    display: 'flex', alignItems: 'center',
    transition: 'color 0.15s',
  },

  /* main */
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 },
  topbar: {
    background: '#fff',
    padding: '16px 28px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
    flexShrink: 0,
  },
  pageTitle: { fontSize: '1.2rem', fontWeight: 700, color: '#1F2937', fontFamily: "'Poppins',sans-serif", marginBottom: 2 },
  breadcrumb: { fontSize: '0.78rem', color: '#9ca3af' },
  topRight:  { display: 'flex', alignItems: 'center', gap: 12 },
  dateBadge: {
    background: '#f3f4f6', borderRadius: 20,
    padding: '5px 12px', fontSize: '0.78rem', color: '#6b7280', fontWeight: 500,
  },

  content: { flex: 1, padding: '28px', overflowY: 'auto' },

  /* dashboard home */
  welcomeCard: {
    background: 'linear-gradient(120deg, #1F2937 0%, #0f172a 60%, #3b1f00 100%)',
    borderRadius: 16,
    padding: '28px 32px',
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  welcomeDecor: {
    position: 'absolute', top: -40, right: -40,
    width: 200, height: 200, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(250,121,33,0.25) 0%, transparent 70%)',
    pointerEvents: 'none',
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    background: '#fff',
    borderRadius: 14,
    padding: '20px 20px 0',
    boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
    position: 'relative',
    overflow: 'hidden',
  },
  statDot:   { width: 8, height: 8, borderRadius: '50%', marginBottom: 12 },
  statValue: { fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: '2rem', color: '#1F2937', lineHeight: 1 },
  statLabel: { fontSize: '0.8rem', color: '#6b7280', marginTop: 6, marginBottom: 16, fontWeight: 500 },
  statAccent: { height: 3, marginLeft: -20, marginRight: -20 },

  noticeCard: {
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: 12,
    padding: '14px 18px',
    display: 'flex', alignItems: 'flex-start', gap: 12,
  },
  noticeIcon: { marginTop: 1, flexShrink: 0 },

  placeholder: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: 320, color: '#d1d5db',
  },
  placeholderIcon: { fontSize: 48, opacity: 0.25 },
};
