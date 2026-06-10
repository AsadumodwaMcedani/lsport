import React, { useState, useEffect, useCallback } from 'react';
import { api, apiUpload } from '../lib/api.js';

const STATUS_STYLE = {
  new:          { bg: '#eff6ff', color: '#1d4ed8', label: 'New' },
  acknowledged: { bg: '#f5f3ff', color: '#7c3aed', label: 'Acknowledged' },
  in_progress:  { bg: '#fff7ed', color: '#c2410c', label: 'In Progress' },
  resolved:     { bg: '#f0fdf4', color: '#15803d', label: 'Resolved' },
  closed:       { bg: '#f3f4f6', color: '#6b7280', label: 'Closed' },
};
const URGENCY_LABELS = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };

export default function StudentQueriesPage({ user, onBack }) {
  const [view, setView]   = useState('list');  // 'list' | 'submit' | 'detail'
  const [queryId, setId]  = useState(null);
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadList = useCallback(async () => {
    setLoading(true);
    try { const d = await api('/queries/student'); setQueries(d); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  function openDetail(id) { setId(id); setView('detail'); }

  if (view === 'submit') return <SubmitForm user={user} onDone={() => { setView('list'); loadList(); }} onBack={() => setView('list')} />;
  if (view === 'detail') return <QueryDetail id={queryId} onBack={() => { setView('list'); loadList(); }} />;

  return (
    <div style={s.page}>
      <header style={s.topbar}>
        <button style={s.backBtn} onClick={onBack}>← Portal</button>
        <div style={s.topTitle}>My Queries</div>
        <button style={s.submitBtn} onClick={() => setView('submit')}>+ New Query</button>
      </header>

      <div style={s.content}>
        {loading ? <Spinner /> : queries.length === 0 ? <Empty onSubmit={() => setView('submit')} /> : (
          <div style={s.list}>
            {queries.map(q => {
              const ss = STATUS_STYLE[q.status] || STATUS_STYLE.new;
              return (
                <div key={q.id} style={s.card} onClick={() => openDetail(q.id)}>
                  <div style={s.cardTop}>
                    <div style={s.cardSubject}>{q.subject}</div>
                    <span style={{ ...s.badge, background: ss.bg, color: ss.color }}>{ss.label}</span>
                  </div>
                  <div style={s.cardMeta}>
                    <span style={s.metaChip}>{q.course_code}</span>
                    <span style={s.metaChip}>{q.category}</span>
                    {q.reply_count > 0 && <span style={s.replyChip}>💬 {q.reply_count} repl{q.reply_count !== 1 ? 'ies' : 'y'}</span>}
                  </div>
                  <div style={s.cardDate}>Submitted {fmtDate(q.created_at)} · Updated {fmtDate(q.updated_at)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Submit Form ── */
function SubmitForm({ user, onBack, onDone }) {
  const [cats, setCats]     = useState([]);
  const [courses, setCourses] = useState([]);
  const [form, setForm]     = useState({ course_id: '', category_id: '', subject: '', description: '', urgency: 'medium', initial_channel: 'portal' });
  const [file, setFile]     = useState(null);
  const [busy, setBusy]     = useState(false);
  const [err, setErr]       = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    api('/queries/categories').then(setCats).catch(() => {});
    api('/courses/active').then(all => {
      // Filter to enrolled courses only — user has course_ids if available
      // Student JWT has course_ids; fall back to all active courses
      setCourses(all);
      if (all.length === 1) setForm(f => ({ ...f, course_id: String(all[0].id) }));
    }).catch(() => {});
  }, []);

  function semLabel(c) {
    const sl = c.semester_label || String(c.semester_number);
    return { '1': 'S1', '2': 'S2', 'Y': 'Year Round', 'AA': 'Always' }[sl] || sl;
  }

  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append('file', file);
      const d = await apiUpload('/queries/student', fd);
      onDone(d.id);
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  }

  return (
    <div style={s.page}>
      <header style={s.topbar}>
        <button style={s.backBtn} onClick={onBack}>← My Queries</button>
        <div style={s.topTitle}>Submit a Query</div>
        <div />
      </header>
      <div style={s.content}>
        <div style={s.formCard}>
          {err && <div style={s.errBox}>{err}</div>}
          <form onSubmit={submit}>
            <Row label="Course *">
              <select style={s.input} value={form.course_id} onChange={set('course_id')} required>
                <option value="">— Select course —</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name} ({c.year} {semLabel(c)})</option>)}
              </select>
            </Row>
            <Row label="Category *">
              <select style={s.input} value={form.category_id} onChange={set('category_id')} required>
                <option value="">— Select category —</option>
                {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Row>
            <Row label="Subject *">
              <input style={s.input} value={form.subject} onChange={set('subject')} placeholder="One-line summary of your query" required maxLength={300} />
            </Row>
            <Row label="Description *">
              <textarea style={{ ...s.input, resize: 'vertical', minHeight: 100 }} value={form.description} onChange={set('description')} placeholder="Provide full details of your query…" required />
            </Row>
            <div style={s.twoCol}>
              <Row label="Urgency">
                <select style={s.input} value={form.urgency} onChange={set('urgency')}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </Row>
              <Row label="How did you first make contact?">
                <select style={s.input} value={form.initial_channel} onChange={set('initial_channel')}>
                  <option value="portal">This Portal (first time)</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="blackboard">Blackboard</option>
                  <option value="in_person">In Person</option>
                </select>
              </Row>
            </div>
            <Row label="Attachment (optional — PDF, JPG, PNG, DOCX, XLSX, max 10 MB)">
              <label style={s.fileArea}>
                {file ? <span>📎 {file.name} <button type="button" style={s.removeFile} onClick={() => setFile(null)}>✕</button></span> : <span style={{ color: '#9ca3af' }}>Click to attach a file</span>}
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
              </label>
            </Row>

            {/* read-only student info */}
            <div style={s.profileBox}>
              <div style={s.profileTitle}>Your Details (pre-filled, read-only)</div>
              <div style={s.profileGrid}>
                <ProfileField label="Name" value={user.surname ? `${user.surname}, ${user.names}` : user.name} />
                <ProfileField label="Email" value={user.email || '—'} />
              </div>
            </div>

            <div style={s.confirmHint}>After submitting, you will receive an email notification when your query is updated.</div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button type="button" style={s.btnGhost} onClick={onBack}>Cancel</button>
              <button style={s.submitBtn2} disabled={busy}>{busy ? 'Submitting…' : 'Submit Query →'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ── Query Detail (student) ── */
function QueryDetail({ id, onBack }) {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]     = useState('');

  useEffect(() => {
    api(`/queries/student/${id}`)
      .then(d => setData(d))
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>Loading…</div>;
  if (!data)   return <div style={{ padding: 40 }}><div style={{ color: '#b91c1c' }}>{err}</div><button style={s.backBtn} onClick={onBack}>← Back</button></div>;

  const { query, messages, statusHistory } = data;
  const ss = STATUS_STYLE[query.status] || STATUS_STYLE.new;

  return (
    <div style={s.page}>
      <header style={s.topbar}>
        <button style={s.backBtn} onClick={onBack}>← My Queries</button>
        <div style={s.topTitle}>Query Detail</div>
        <span style={{ ...s.badge, background: ss.bg, color: ss.color, marginRight: 4 }}>{ss.label}</span>
      </header>
      <div style={s.content}>
        {/* query body */}
        <div style={s.formCard}>
          <h3 style={s.detailSubject}>{query.subject}</h3>
          <div style={s.detailMeta}>
            <span style={s.metaChip}>{query.course_code}</span>
            <span style={s.metaChip}>{query.category}</span>
            <span style={s.metaChip}>{URGENCY_LABELS[query.urgency] || query.urgency} priority</span>
          </div>
          <p style={s.detailDesc}>{query.description}</p>
          {query.file_name && (
            <a href={`/api/v1/queries/${query.id}/file`} target="_blank" rel="noreferrer" style={s.fileLink}>
              📎 {query.file_name}
            </a>
          )}
        </div>

        {/* status timeline */}
        <div style={s.timelineCard}>
          <div style={s.sectionLabel}>Status Timeline</div>
          <div style={s.timeline}>
            <TimelineItem status="new" label="Submitted" date={query.created_at} done />
            {statusHistory.map((h, i) => {
              const ns = STATUS_STYLE[h.new_status] || STATUS_STYLE.new;
              return (
                <TimelineItem key={i} status={h.new_status} label={ns.label} date={h.changed_at} note={h.notes} done />
              );
            })}
          </div>
        </div>

        {/* message thread */}
        <div style={s.formCard}>
          <div style={s.sectionLabel}>Messages</div>
          {messages.length === 0
            ? <p style={{ color: '#9ca3af', fontSize: '0.88rem' }}>No messages yet. You'll be notified by email when there's a reply.</p>
            : messages.map(m => (
              <div key={m.id} style={{ ...s.bubble, ...(m.sender_type === 'student' ? s.bubbleStudent : s.bubbleAdmin) }}>
                <div style={s.bubbleMeta}>
                  <span style={s.bubbleSender}>{m.sender_type === 'student' ? 'You' : 'Lecturer'}</span>
                  <span style={s.bubbleTime}>{fmtDateFull(m.created_at)}</span>
                </div>
                <div style={s.bubbleText}>{m.message}</div>
                {m.file_name && (
                  <a href={`/api/v1/queries/${query.id}/messages/${m.id}/file`} target="_blank" rel="noreferrer" style={s.fileLink}>
                    📎 {m.file_name}
                  </a>
                )}
              </div>
            ))
          }
          {query.status === 'closed' && (
            <div style={s.closedNote}>This query is closed. To raise a new concern, please submit a new query.</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Timeline item ── */
function TimelineItem({ status, label, date, note, done }) {
  const ss = STATUS_STYLE[status] || STATUS_STYLE.new;
  return (
    <div style={s.tlItem}>
      <div style={{ ...s.tlDot, background: done ? ss.color : '#e5e7eb' }} />
      <div style={s.tlBody}>
        <span style={{ ...s.badge, background: ss.bg, color: ss.color, fontSize: '0.75rem' }}>{label}</span>
        <span style={s.tlDate}>{fmtDate(date)}</span>
        {note && <div style={s.tlNote}>{note}</div>}
      </div>
    </div>
  );
}

/* ── small helpers ── */
function Row({ label, children }) { return <div style={{ marginBottom: 16 }}><label style={s.label}>{label}</label>{children}</div>; }
function ProfileField({ label, value }) { return <div><div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>{label}</div><div style={{ fontSize: '0.88rem', color: '#374151' }}>{value}</div></div>; }
function Empty({ onSubmit }) { return <div style={{ textAlign: 'center', padding: '60px 20px' }}><div style={{ fontSize: '2.5rem', marginBottom: 10 }}>💬</div><p style={{ color: '#9ca3af', marginBottom: 20 }}>You haven't submitted any queries yet.</p><button style={s.submitBtn2} onClick={onSubmit}>Submit Your First Query</button></div>; }
function Spinner() { return <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>Loading…</div>; }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'; }
function fmtDateFull(d) { return d ? new Date(d).toLocaleString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : '—'; }

const s = {
  page:     { minHeight: '100vh', background: '#f4f5f7', display: 'flex', flexDirection: 'column', fontFamily: "'Open Sans',sans-serif" },
  topbar:   { background: '#0f172a', padding: '0 20px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  topTitle: { color: '#fff', fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: '1rem' },
  backBtn:  { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8', borderRadius: 7, padding: '6px 14px', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' },
  submitBtn:{ background: '#FA7921', color: '#fff', border: 'none', borderRadius: 7, padding: '7px 16px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit' },
  submitBtn2:{ background: 'linear-gradient(90deg,#FA7921,#e06010)', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 24px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: "'Poppins',sans-serif", boxShadow: '0 4px 14px rgba(250,121,33,0.35)' },
  content:  { flex: 1, padding: '24px 20px', maxWidth: 760, width: '100%', margin: '0 auto', boxSizing: 'border-box' },
  list:     { display: 'flex', flexDirection: 'column', gap: 12 },
  card:     { background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', cursor: 'pointer', transition: 'box-shadow 0.15s' },
  cardTop:  { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  cardSubject:{ fontWeight: 600, color: '#1F2937', fontSize: '0.92rem', flex: 1 },
  cardMeta: { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 },
  cardDate: { fontSize: '0.75rem', color: '#9ca3af' },
  badge:    { borderRadius: 20, padding: '3px 10px', fontWeight: 600, fontSize: '0.78rem', display: 'inline-block', whiteSpace: 'nowrap' },
  metaChip: { background: '#f3f4f6', color: '#6b7280', borderRadius: 6, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 500 },
  replyChip:{ background: '#eff6ff', color: '#1d4ed8', borderRadius: 6, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600 },

  formCard: { background: '#fff', borderRadius: 14, padding: '24px', marginBottom: 16, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' },
  label:    { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 5 },
  input:    { display: 'block', width: '100%', padding: '10px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', boxSizing: 'border-box', fontFamily: 'inherit', color: '#1F2937' },
  twoCol:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' },
  fileArea: { display: 'flex', alignItems: 'center', gap: 8, border: '1.5px dashed #e5e7eb', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', fontSize: '0.88rem', color: '#374151' },
  removeFile:{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0 4px', fontSize: '0.9rem' },
  profileBox: { background: '#f9fafb', borderRadius: 10, padding: '14px 16px', marginBottom: 16, marginTop: 6 },
  profileTitle:{ fontSize: '0.75rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginBottom: 10 },
  profileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' },
  confirmHint: { fontSize: '0.82rem', color: '#9ca3af', lineHeight: 1.5 },
  btnGhost: { background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '11px 20px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit' },
  errBox:   { background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: 8, padding: '10px 14px', fontSize: '0.85rem', marginBottom: 14 },
  fileLink: { display: 'inline-flex', alignItems: 'center', gap: 6, color: '#FA7921', fontSize: '0.84rem', textDecoration: 'none', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 6, padding: '4px 10px', marginTop: 8 },

  detailSubject: { fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: '1.05rem', color: '#1F2937', margin: '0 0 10px' },
  detailMeta:  { display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 },
  detailDesc:  { color: '#374151', fontSize: '0.9rem', lineHeight: 1.65, margin: '0 0 12px', whiteSpace: 'pre-wrap' },
  sectionLabel:{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 },
  timelineCard:{ background: '#fff', borderRadius: 14, padding: '20px 24px', marginBottom: 16, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' },
  timeline:    { display: 'flex', flexDirection: 'column', gap: 14 },
  tlItem:      { display: 'flex', gap: 12, alignItems: 'flex-start' },
  tlDot:       { width: 10, height: 10, borderRadius: '50%', flexShrink: 0, marginTop: 6 },
  tlBody:      { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', flex: 1 },
  tlDate:      { fontSize: '0.75rem', color: '#9ca3af' },
  tlNote:      { width: '100%', fontSize: '0.8rem', color: '#6b7280', fontStyle: 'italic' },
  bubble:      { borderRadius: 12, padding: '12px 16px', marginBottom: 10 },
  bubbleStudent:{ background: '#f9fafb', border: '1px solid #f0f0f0' },
  bubbleAdmin: { background: '#fff', border: '1px solid #e5e7eb' },
  bubbleMeta:  { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  bubbleSender:{ fontSize: '0.8rem', fontWeight: 700, color: '#374151' },
  bubbleTime:  { fontSize: '0.75rem', color: '#9ca3af' },
  bubbleText:  { fontSize: '0.88rem', color: '#1F2937', lineHeight: 1.6, whiteSpace: 'pre-wrap' },
  closedNote:  { background: '#f3f4f6', borderRadius: 8, padding: '12px 16px', color: '#6b7280', fontSize: '0.84rem', marginTop: 12 },
};
