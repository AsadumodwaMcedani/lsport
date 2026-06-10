import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses]   = useState([]);
  const [filter, setFilter]     = useState({ course_id: '', search: '' });
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api('/courses').then(setCourses).catch(() => {});
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.course_id) params.set('course_id', filter.course_id);
      if (filter.search)    params.set('search', filter.search);
      const d = await api(`/students?${params}`);
      setStudents(d);
    } catch { setStudents([]); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [filter.course_id]);

  return (
    <div style={s.page}>
      <div style={s.toolbar}>
        <div style={s.toolbarLeft}>
          <h2 style={s.heading}>Students</h2>
          <span style={s.count}>{students.length} student{students.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div style={s.filters}>
        <select style={s.select} value={filter.course_id} onChange={e => setFilter(f => ({ ...f, course_id: e.target.value }))}>
          <option value="">All Courses</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name} ({c.year} S{c.semester_number})</option>)}
        </select>
        <div style={s.searchWrap}>
          <input style={s.searchInput} placeholder="Search name or student number…" value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} onKeyDown={e => e.key === 'Enter' && load()} />
          <button style={s.searchBtn} onClick={load}>Search</button>
        </div>
      </div>

      {loading ? <Skeleton />
        : students.length === 0
          ? <Empty hasFilter={!!filter.course_id || !!filter.search} />
          : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead><tr>{['Student #', 'Surname', 'Names', 'Email', 'Phone', 'Courses', 'Status'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {students.map(st => (
                    <tr key={st.id} style={s.tr}>
                      <td style={s.td}><span style={s.code}>{st.student_number}</span></td>
                      <td style={{ ...s.td, fontWeight: 600 }}>{st.surname}</td>
                      <td style={s.td}>{st.names}</td>
                      <td style={s.td}>{st.email || <span style={{ color: '#d1d5db' }}>—</span>}</td>
                      <td style={s.td}>{st.phone || <span style={{ color: '#d1d5db' }}>—</span>}</td>
                      <td style={s.td}><span style={s.badge}>{st.course_count}</span></td>
                      <td style={s.td}><span style={{ ...s.status, ...(st.is_active ? s.active : s.inactive) }}>{st.is_active ? 'Active' : 'Inactive'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
    </div>
  );
}

function Skeleton() { return <div>{[...Array(5)].map((_, i) => <div key={i} style={{ ...s.skRow, animationDelay: `${i * 0.07}s` }} />)}</div>; }
function Empty({ hasFilter }) {
  return (
    <div style={s.empty}>
      <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>👥</div>
      <p style={{ color: '#9ca3af' }}>{hasFilter ? 'No students match your filter.' : 'No students yet. Upload a class list from the Courses page.'}</p>
    </div>
  );
}

const s = {
  page:       { animation: 'fadeUp 0.3s ease' },
  toolbar:    { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  toolbarLeft:{ display: 'flex', alignItems: 'center', gap: 12 },
  heading:    { fontFamily: "'Poppins',sans-serif", fontSize: '1.1rem', fontWeight: 700, color: '#1F2937' },
  count:      { background: '#f3f4f6', color: '#6b7280', borderRadius: 20, padding: '2px 10px', fontSize: '0.8rem', fontWeight: 600 },
  filters:    { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
  select:     { padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.88rem', color: '#374151', background: '#fff', minWidth: 220, fontFamily: 'inherit' },
  searchWrap: { display: 'flex', flex: 1, minWidth: 240 },
  searchInput:{ flex: 1, padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: '8px 0 0 8px', fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit', color: '#374151' },
  searchBtn:  { background: '#FA7921', color: '#fff', border: 'none', borderRadius: '0 8px 8px 0', padding: '9px 16px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
  tableWrap:  { background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' },
  table:      { width: '100%', borderCollapse: 'collapse' },
  th:         { background: '#f9fafb', padding: '11px 14px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #f0f0f0' },
  tr:         { borderBottom: '1px solid #f9fafb' },
  td:         { padding: '11px 14px', fontSize: '0.88rem', color: '#374151' },
  code:       { background: '#f3f4f6', borderRadius: 5, padding: '2px 8px', fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: '#1F2937' },
  badge:      { background: '#eff6ff', color: '#1d4ed8', borderRadius: 20, padding: '2px 9px', fontWeight: 700, fontSize: '0.8rem' },
  status:     { borderRadius: 20, padding: '3px 10px', fontWeight: 600, fontSize: '0.78rem' },
  active:     { background: '#f0fdf4', color: '#15803d' },
  inactive:   { background: '#f9fafb', color: '#9ca3af' },
  skRow:      { height: 48, background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)', borderRadius: 8, marginBottom: 8, animation: 'shimmer 1.5s infinite' },
  empty:      { textAlign: 'center', padding: '60px 20px' },
};
