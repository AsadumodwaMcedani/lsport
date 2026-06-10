import React, { useState, useEffect, useCallback } from 'react';
import { api, apiUpload } from '../lib/api.js';

/* ── colour maps ── */
const STATUS_STYLE = {
  new:          { bg: '#eff6ff', color: '#1d4ed8', label: 'New' },
  acknowledged: { bg: '#f5f3ff', color: '#7c3aed', label: 'Acknowledged' },
  in_progress:  { bg: '#fff7ed', color: '#c2410c', label: 'In Progress' },
  resolved:     { bg: '#f0fdf4', color: '#15803d', label: 'Resolved' },
  closed:       { bg: '#f3f4f6', color: '#6b7280', label: 'Closed' },
};
const URGENCY_STYLE = {
  low:    { bg: '#f3f4f6', color: '#6b7280' },
  medium: { bg: '#eff6ff', color: '#1d4ed8' },
  high:   { bg: '#fff7ed', color: '#c2410c' },
  urgent: { bg: '#fef2f2', color: '#b91c1c' },
};
const CHANNEL_LABEL = { whatsapp: 'WhatsApp', email: 'Email', blackboard: 'Blackboard', f2f: 'In Person', system_message: 'System' };

export default function QueriesPage() {
  const [view, setView]     = useState('list');   // 'list' | 'detail'
  const [queryId, setQueryId] = useState(null);
  const [courses, setCourses] = useState([]);
  const [filters, setFilters] = useState({ status: 'new,acknowledged,in_progress', course_id: '', search: '' });
  const [queries, setQueries] = useState([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api('/courses').then(setCourses).catch(() => {}); }, []);

  const load = useCallback(async (f = filters, p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 20 });
      if (f.status)    params.set('status', f.status);
      if (f.course_id) params.set('course_id', f.course_id);
      if (f.search)    params.set('search', f.search);
      const d = await api(`/queries?${params}`);
      setQueries(d.queries); setTotal(d.total);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(filters, page); }, [filters, page]);

  function openDetail(id) { setQueryId(id); setView('detail'); }
  function backToList()   { setView('list'); setQueryId(null); load(filters, page); }

  if (view === 'detail') return <QueryDetail id={queryId} onBack={backToList} />;

  return (
    <div style={s.page}>
      {/* filter bar */}
      <div style={s.filterBar}>
        <input
          style={s.search}
          placeholder="Search subject, name, student number…"
          value={filters.search}
          onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
        />
        <select style={s.filterSel} value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}>
          <option value="new,acknowledged,in_progress">Open queries</option>
          <option value="new">New only</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
          <option value="">All statuses</option>
        </select>
        <select style={s.filterSel} value={filters.course_id} onChange={e => { setFilters(f => ({ ...f, course_id: e.target.value })); setPage(1); }}>
          <option value="">All courses</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
        </select>
        <span style={s.totalBadge}>{total} quer{total !== 1 ? 'ies' : 'y'}</span>
      </div>

      {/* table */}
      {loading ? <Skeleton /> : queries.length === 0 ? <Empty search={filters.search} /> : (
        <div style={s.tableWrap}>
          <table style={s.table}>
            <thead>
              <tr>{['#', 'Student', 'Course', 'Category', 'Subject', 'Urgency', 'Status', 'Updated'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {queries.map(q => {
                const ss = STATUS_STYLE[q.status] || STATUS_STYLE.new;
                const us = URGENCY_STYLE[q.urgency] || URGENCY_STYLE.medium;
                return (
                  <tr key={q.id} style={s.tr} onClick={() => openDetail(q.id)}>
                    <td style={{ ...s.td, color: '#9ca3af', fontSize: '0.8rem' }}>#{q.id}</td>
                    <td style={s.td}>
                      <div style={s.studentName}>{q.student_name}</div>
                      <div style={s.studentNum}>{q.student_number}</div>
                    </td>
                    <td style={s.td}><span style={s.courseCode}>{q.course_code}</span></td>
                    <td style={{ ...s.td, fontSize: '0.82rem', color: '#6b7280' }}>{q.category}</td>
                    <td style={s.td}>
                      <div style={s.subject}>{q.subject}</div>
                      {q.message_count > 0 && <div style={s.msgCount}>💬 {q.message_count} repl{q.message_count !== 1 ? 'ies' : 'y'}</div>}
                    </td>
                    <td style={s.td}><span style={{ ...s.badge, background: us.bg, color: us.color }}>{q.urgency}</span></td>
                    <td style={s.td}><span style={{ ...s.badge, background: ss.bg, color: ss.color }}>{ss.label}</span></td>
                    <td style={{ ...s.td, fontSize: '0.8rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>{fmtDate(q.updated_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* pagination */}
      {total > 20 && (
        <div style={s.pagination}>
          <button style={s.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Page {page} of {Math.ceil(total / 20)}</span>
          <button style={s.pageBtn} disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}

/* ── Query Detail ── */
function QueryDetail({ id, onBack }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [msgText, setMsgText] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [msgFile, setMsgFile] = useState(null);
  const [msgBusy, setMsgBusy] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [statusBusy, setStatusBusy] = useState(false);
  const [showInteraction, setShowInteraction] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const d = await api(`/queries/${id}`); setData(d); setNewStatus(d.query.status); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!msgText.trim()) return;
    setMsgBusy(true); setErr('');
    try {
      const fd = new FormData();
      fd.append('message', msgText); fd.append('is_public', isPublic ? 'true' : 'false');
      if (msgFile) fd.append('file', msgFile);
      await apiUpload(`/queries/${id}/messages`, fd);
      setMsgText(''); setMsgFile(null); await load();
    } catch (ex) { setErr(ex.message); } finally { setMsgBusy(false); }
  }

  async function changeStatus() {
    if (!newStatus || newStatus === data.query.status) return;
    setStatusBusy(true); setErr('');
    try {
      await api(`/queries/${id}/status`, { method: 'PATCH', body: { status: newStatus, notes: statusNotes } });
      setStatusNotes(''); await load();
    } catch (ex) { setErr(ex.message); } finally { setStatusBusy(false); }
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>Loading…</div>;
  if (!data) return <div style={{ padding: 40 }}><div style={{ color: '#b91c1c' }}>{err}</div><button style={s.backBtn} onClick={onBack}>← Back</button></div>;

  const { query, messages, statusHistory, interactions } = data;
  const ss = STATUS_STYLE[query.status] || STATUS_STYLE.new;
  const us = URGENCY_STYLE[query.urgency] || URGENCY_STYLE.medium;

  return (
    <div style={s.detailWrap}>
      {/* header */}
      <div style={s.detailHeader}>
        <button style={s.backBtn} onClick={onBack}>← All Queries</button>
        <div style={s.detailHeaderRight}>
          <span style={{ ...s.badge, background: us.bg, color: us.color }}>{query.urgency}</span>
          <span style={{ ...s.badge, background: ss.bg, color: ss.color, fontSize: '0.82rem' }}>{ss.label}</span>
        </div>
      </div>

      {err && <div style={s.errBox}>{err}</div>}

      <div style={s.detailLayout}>
        {/* left: thread */}
        <div style={s.threadCol}>
          {/* student info */}
          <div style={s.infoCard}>
            <div style={s.infoGrid}>
              <InfoRow label="Student" value={query.student_name} />
              <InfoRow label="Student #" value={query.student_number} />
              <InfoRow label="Course" value={`${query.course_code} — ${query.course_name}`} />
              <InfoRow label="Category" value={query.category} />
              <InfoRow label="Via" value={CHANNEL_LABEL[query.initial_channel] || query.initial_channel} />
              <InfoRow label="Submitted" value={fmtDateFull(query.created_at)} />
            </div>
          </div>

          {/* query description */}
          <div style={s.queryCard}>
            <h3 style={s.querySubject}>{query.subject}</h3>
            <p style={s.queryDesc}>{query.description}</p>
            {query.file_name && (
              <a href={`/api/v1/queries/${query.id}/file`} target="_blank" rel="noreferrer" style={s.fileLink}>
                📎 {query.file_name}
              </a>
            )}
          </div>

          {/* message thread */}
          <div style={s.threadSection}>
            <div style={s.sectionLabel}>Thread</div>
            {messages.length === 0 && <div style={s.emptyThread}>No messages yet.</div>}
            {messages.map(m => {
              const isAdmin = m.sender_type === 'admin';
              const isPrivate = !m.is_public;
              return (
                <div key={m.id} style={{ ...s.bubble, ...(isAdmin ? s.bubbleAdmin : s.bubbleStudent), ...(isPrivate ? s.bubblePrivate : {}) }}>
                  <div style={s.bubbleMeta}>
                    <span style={s.bubbleSender}>{isAdmin ? '🎓 Lecturer' : '🎓 Student'}</span>
                    {isPrivate && <span style={s.privatePill}>🔒 Private Note</span>}
                    <span style={s.bubbleTime}>{fmtDateFull(m.created_at)}</span>
                  </div>
                  <div style={s.bubbleText}>{m.message}</div>
                  {m.file_name && (
                    <a href={`/api/v1/queries/${query.id}/messages/${m.id}/file`} target="_blank" rel="noreferrer" style={s.fileLink}>
                      📎 {m.file_name}
                    </a>
                  )}
                </div>
              );
            })}
          </div>

          {/* reply form */}
          {query.status !== 'closed' && (
            <form onSubmit={sendMessage} style={s.replyForm}>
              <div style={s.toggleRow}>
                <button type="button" style={{ ...s.toggleBtn, ...(isPublic ? s.toggleActive : {}) }} onClick={() => setIsPublic(true)}>💬 Public Reply</button>
                <button type="button" style={{ ...s.toggleBtn, ...(!isPublic ? s.toggleActivePrivate : {}) }} onClick={() => setIsPublic(false)}>🔒 Private Note</button>
              </div>
              <textarea
                style={{ ...s.textarea, background: isPublic ? '#fff' : '#fefce8', borderColor: isPublic ? '#e5e7eb' : '#fde68a' }}
                placeholder={isPublic ? 'Write a reply visible to the student…' : 'Write a private note (only you can see this)…'}
                value={msgText} onChange={e => setMsgText(e.target.value)} rows={4} required
              />
              <div style={s.replyFooter}>
                <label style={s.filePickerLabel}>
                  📎 {msgFile ? msgFile.name : 'Attach file'}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx" style={{ display: 'none' }} onChange={e => setMsgFile(e.target.files[0])} />
                </label>
                <button style={s.sendBtn} disabled={msgBusy || !msgText.trim()}>
                  {msgBusy ? 'Sending…' : isPublic ? 'Send Reply' : 'Save Note'}
                </button>
              </div>
            </form>
          )}
          {query.status === 'closed' && <div style={s.closedNotice}>This query is closed. No further messages can be added.</div>}
        </div>

        {/* right: status + interactions */}
        <div style={s.sideCol}>
          {/* status control */}
          <div style={s.sideCard}>
            <div style={s.sideCardTitle}>Change Status</div>
            <select style={s.input} value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              <option value="new">New</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <textarea style={{ ...s.textarea, marginTop: 8, fontSize: '0.83rem' }} placeholder="Optional note about this change…" value={statusNotes} onChange={e => setStatusNotes(e.target.value)} rows={2} />
            <button
              style={{ ...s.sendBtn, width: '100%', marginTop: 8, opacity: newStatus === query.status ? 0.5 : 1 }}
              disabled={statusBusy || newStatus === query.status}
              onClick={changeStatus}
            >
              {statusBusy ? 'Saving…' : 'Update Status'}
            </button>
          </div>

          {/* status history */}
          <div style={s.sideCard}>
            <div style={s.sideCardTitle}>Status History</div>
            {statusHistory.length === 0 && <div style={{ color: '#9ca3af', fontSize: '0.82rem' }}>No changes yet.</div>}
            {statusHistory.map(h => {
              const ns = STATUS_STYLE[h.new_status] || STATUS_STYLE.new;
              return (
                <div key={h.id} style={s.histItem}>
                  <span style={{ ...s.badge, background: ns.bg, color: ns.color, fontSize: '0.75rem' }}>{ns.label}</span>
                  <span style={s.histTime}>{fmtDate(h.changed_at)}</span>
                  {h.notes && <div style={s.histNote}>{h.notes}</div>}
                </div>
              );
            })}
          </div>

          {/* interaction log */}
          <div style={s.sideCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={s.sideCardTitle}>Interaction Log</div>
              <button style={s.logBtn} onClick={() => setShowInteraction(true)}>+ Log</button>
            </div>
            {interactions.length === 0 && <div style={{ color: '#9ca3af', fontSize: '0.82rem' }}>No interactions logged.</div>}
            {interactions.map(i => (
              <div key={i.id} style={s.interactionItem}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={s.channelBadge}>{CHANNEL_LABEL[i.channel] || i.channel}</span>
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{i.direction !== 'n/a' ? i.direction : ''}</span>
                </div>
                <div style={s.interactionSummary}>{i.summary}</div>
                <div style={s.histTime}>{fmtDate(i.logged_at)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showInteraction && <LogInteractionModal queryId={id} onDone={() => { setShowInteraction(false); load(); }} onClose={() => setShowInteraction(false)} />}
    </div>
  );
}

/* ── Log Interaction Modal ── */
function LogInteractionModal({ queryId, onDone, onClose }) {
  const [form, setForm] = useState({ channel: 'whatsapp', direction: 'n/a', summary: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      await api(`/queries/${queryId}/interactions`, { method: 'POST', body: form });
      onDone();
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  }

  return (
    <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={s.modal}>
        <div style={s.modalHeader}>
          <span style={s.modalTitle}>Log External Interaction</span>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>
        {err && <div style={s.errBox}>{err}</div>}
        <form onSubmit={submit}>
          <label style={s.label}>Channel</label>
          <select style={s.input} value={form.channel} onChange={set('channel')}>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
            <option value="blackboard">Blackboard</option>
            <option value="f2f">In Person (F2F)</option>
            <option value="system_message">System Message</option>
          </select>
          <label style={{ ...s.label, marginTop: 12 }}>Direction</label>
          <select style={s.input} value={form.direction} onChange={set('direction')}>
            <option value="sent">Sent (you → student)</option>
            <option value="received">Received (student → you)</option>
            <option value="n/a">N/A</option>
          </select>
          <label style={{ ...s.label, marginTop: 12 }}>Summary *</label>
          <textarea style={s.textarea} value={form.summary} onChange={set('summary')} placeholder="Describe what was communicated…" rows={4} required />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <button type="button" style={s.btnGhost} onClick={onClose}>Cancel</button>
            <button style={s.sendBtn} disabled={busy}>{busy ? 'Saving…' : 'Save Interaction'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── helpers ── */
function InfoRow({ label, value }) {
  return (
    <div style={s.infoRow}>
      <span style={s.infoLabel}>{label}</span>
      <span style={s.infoValue}>{value || '—'}</span>
    </div>
  );
}
function Skeleton() { return <div style={{ opacity: 0.5 }}>{[...Array(5)].map((_, i) => <div key={i} style={{ height: 56, background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', borderRadius: 8, marginBottom: 8, animation: 'shimmer 1.5s infinite' }} />)}</div>; }
function Empty({ search }) { return <div style={{ textAlign: 'center', padding: '60px 20px' }}><div style={{ fontSize: '2.5rem', marginBottom: 10 }}>💬</div><p style={{ color: '#9ca3af' }}>{search ? `No queries match "${search}"` : 'No queries in this filter.'}</p></div>; }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short' }) + ' ' + new Date(d).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—'; }
function fmtDateFull(d) { return d ? new Date(d).toLocaleString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : '—'; }

const s = {
  page:       { animation: 'fadeUp 0.3s ease' },
  filterBar:  { display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' },
  search:     { flex: '1 1 220px', padding: '9px 13px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.88rem', fontFamily: 'inherit', color: '#1F2937', background: '#fff', minWidth: 0 },
  filterSel:  { padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.85rem', fontFamily: 'inherit', color: '#374151', background: '#fff', cursor: 'pointer' },
  totalBadge: { background: '#f3f4f6', color: '#6b7280', borderRadius: 20, padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap' },
  tableWrap:  { background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' },
  table:      { width: '100%', borderCollapse: 'collapse' },
  th:         { background: '#f9fafb', padding: '11px 14px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #f0f0f0' },
  tr:         { borderBottom: '1px solid #f9fafb', cursor: 'pointer', transition: 'background 0.1s' },
  td:         { padding: '13px 14px', fontSize: '0.87rem', color: '#374151' },
  studentName:{ fontWeight: 600, color: '#1F2937', fontSize: '0.87rem' },
  studentNum: { color: '#9ca3af', fontSize: '0.78rem', marginTop: 2 },
  courseCode: { background: '#f3f4f6', borderRadius: 5, padding: '2px 7px', fontFamily: 'monospace', fontSize: '0.82rem', fontWeight: 700, color: '#1F2937' },
  subject:    { fontWeight: 500, color: '#1F2937', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  msgCount:   { color: '#9ca3af', fontSize: '0.75rem', marginTop: 3 },
  badge:      { borderRadius: 20, padding: '3px 10px', fontWeight: 600, fontSize: '0.78rem', display: 'inline-block' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 20 },
  pageBtn:    { background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '7px 16px', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit', color: '#374151' },

  /* detail */
  detailWrap:    { animation: 'fadeUp 0.25s ease' },
  detailHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  detailHeaderRight: { display: 'flex', gap: 8, alignItems: 'center' },
  backBtn:       { background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '7px 14px', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit', color: '#374151' },
  detailLayout:  { display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' },
  threadCol:     { display: 'flex', flexDirection: 'column', gap: 16 },
  sideCol:       { display: 'flex', flexDirection: 'column', gap: 14 },

  infoCard:   { background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' },
  infoGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' },
  infoRow:    { display: 'flex', flexDirection: 'column', gap: 2 },
  infoLabel:  { fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' },
  infoValue:  { fontSize: '0.87rem', color: '#1F2937', fontWeight: 500 },

  queryCard:  { background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' },
  querySubject:{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: '1.05rem', color: '#1F2937', margin: '0 0 12px' },
  queryDesc:  { color: '#374151', fontSize: '0.9rem', lineHeight: 1.65, margin: '0 0 12px', whiteSpace: 'pre-wrap' },
  fileLink:   { display: 'inline-flex', alignItems: 'center', gap: 6, color: '#FA7921', fontSize: '0.84rem', textDecoration: 'none', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 6, padding: '4px 10px' },

  threadSection: { display: 'flex', flexDirection: 'column', gap: 10 },
  sectionLabel:  { fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 },
  emptyThread:   { color: '#9ca3af', fontSize: '0.85rem', padding: '16px 0' },
  bubble:        { borderRadius: 12, padding: '12px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' },
  bubbleStudent: { background: '#f9fafb', border: '1px solid #f0f0f0' },
  bubbleAdmin:   { background: '#fff', border: '1px solid #e5e7eb' },
  bubblePrivate: { background: '#fefce8', border: '1px dashed #fde68a' },
  bubbleMeta:    { display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' },
  bubbleSender:  { fontSize: '0.8rem', fontWeight: 700, color: '#374151' },
  privatePill:   { fontSize: '0.72rem', background: '#fef9c3', color: '#854d0e', borderRadius: 10, padding: '1px 8px', fontWeight: 600 },
  bubbleTime:    { fontSize: '0.75rem', color: '#9ca3af', marginLeft: 'auto' },
  bubbleText:    { fontSize: '0.88rem', color: '#1F2937', lineHeight: 1.6, whiteSpace: 'pre-wrap' },

  replyForm:     { background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 0 },
  toggleRow:     { display: 'flex', gap: 0, marginBottom: 10, borderRadius: 8, overflow: 'hidden', border: '1.5px solid #e5e7eb', width: 'fit-content' },
  toggleBtn:     { background: '#fff', border: 'none', padding: '7px 16px', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer', color: '#6b7280', fontFamily: 'inherit' },
  toggleActive:  { background: '#eff6ff', color: '#1d4ed8' },
  toggleActivePrivate: { background: '#fefce8', color: '#854d0e' },
  textarea:      { display: 'block', width: '100%', padding: '10px 13px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: '0.88rem', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', color: '#1F2937' },
  replyFooter:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  filePickerLabel:{ fontSize: '0.82rem', color: '#9ca3af', cursor: 'pointer' },
  sendBtn:       { background: '#FA7921', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit' },
  closedNotice:  { background: '#f3f4f6', borderRadius: 10, padding: '14px 18px', color: '#6b7280', fontSize: '0.85rem', textAlign: 'center' },

  sideCard:      { background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' },
  sideCardTitle: { fontSize: '0.75rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 },
  input:         { display: 'block', width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 7, fontSize: '0.88rem', boxSizing: 'border-box', fontFamily: 'inherit', color: '#1F2937' },
  histItem:      { marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #f0f0f0' },
  histTime:      { fontSize: '0.73rem', color: '#9ca3af', marginTop: 4 },
  histNote:      { fontSize: '0.8rem', color: '#6b7280', marginTop: 3, fontStyle: 'italic' },
  logBtn:        { background: 'none', border: '1.5px solid #e5e7eb', borderRadius: 7, padding: '4px 12px', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit', color: '#374151' },
  interactionItem: { marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #f0f0f0' },
  channelBadge:  { background: '#f3f4f6', color: '#374151', borderRadius: 6, padding: '2px 8px', fontSize: '0.75rem', fontWeight: 600 },
  interactionSummary: { fontSize: '0.83rem', color: '#374151', marginTop: 4, lineHeight: 1.5 },

  /* modal */
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 },
  modal:      { background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: '1rem', color: '#1F2937' },
  closeBtn:   { background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', color: '#9ca3af' },
  label:      { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 5 },
  btnGhost:   { background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit' },
  errBox:     { background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: 8, padding: '10px 14px', fontSize: '0.85rem', marginBottom: 14 },
};
