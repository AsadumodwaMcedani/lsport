import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api.js';

const C = {
  orange: '#FA7921', dark: '#1F2937', cream: '#FFF8F0',
  brown: '#7D4600', yellow: '#FFE66D', muted: '#6B7280',
  border: '#E5E7EB', red: '#EF4444', green: '#10B981',
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtFull = (d) => d ? new Date(d).toLocaleString('en-ZA') : '—';
const isExpired = (d) => d && new Date(d) < new Date();

const TARGET_LABELS = { all: 'All Students', course: 'By Course', student: 'Specific Students' };

function Badge({ children, color = C.muted }) {
  return (
    <span style={{ background: color + '22', color, border: `1px solid ${color}55`,
      borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

function CreateForm({ onSave, onCancel }) {
  const [form, setForm] = useState({
    title: '', content: '', target_type: 'all',
    target_ids: [], student_numbers: '', is_pinned: false, expires_at: '',
  });
  const [courses, setCourses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api('/courses').then(d => setCourses(d)).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleCourse = (id) => {
    set('target_ids', form.target_ids.includes(id)
      ? form.target_ids.filter(x => x !== id)
      : [...form.target_ids, id]);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return setErr('Title and content required.');
    setSaving(true); setErr('');
    try {
      await api('/announcements', {
        method: 'POST',
        body: {
          title: form.title, content: form.content,
          target_type: form.target_type,
          target_ids: form.target_type === 'course' ? form.target_ids : [],
          student_numbers: form.target_type === 'student' ? form.student_numbers : '',
          is_pinned: form.is_pinned,
          expires_at: form.expires_at || null,
        },
      });
      onSave();
    } catch (e) { setErr(e.message); } finally { setSaving(false); }
  };

  const inp = { width: '100%', padding: '8px 12px', border: `1px solid ${C.border}`,
    borderRadius: 8, fontSize: 14, boxSizing: 'border-box', outline: 'none', background: '#fff' };

  return (
    <form onSubmit={submit} style={{ background: '#fff', border: `1px solid ${C.border}`,
      borderRadius: 12, padding: 24, marginBottom: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: C.dark, marginBottom: 16 }}>New Announcement</div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 4 }}>Title *</label>
        <input style={inp} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Announcement title" />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 4 }}>Content *</label>
        <textarea style={{ ...inp, height: 120, resize: 'vertical', fontFamily: 'inherit' }}
          value={form.content} onChange={e => set('content', e.target.value)} placeholder="Announcement content..." />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 4 }}>Target</label>
          <select style={inp} value={form.target_type} onChange={e => set('target_type', e.target.value)}>
            <option value="all">All Students</option>
            <option value="course">By Course</option>
            <option value="student">Specific Students</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 4 }}>Expiry Date (optional)</label>
          <input type="date" style={inp} value={form.expires_at} onChange={e => set('expires_at', e.target.value)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
            <input type="checkbox" checked={form.is_pinned} onChange={e => set('is_pinned', e.target.checked)} />
            Pin to top
          </label>
        </div>
      </div>

      {form.target_type === 'course' && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 6 }}>
            Select Courses ({form.target_ids.length} selected)
          </label>
          <div style={{ border: `1px solid ${C.border}`, borderRadius: 8, maxHeight: 150,
            overflowY: 'auto', padding: '6px 0' }}>
            {courses.map(c => (
              <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8,
                padding: '4px 12px', cursor: 'pointer', fontSize: 13,
                background: form.target_ids.includes(c.id) ? C.orange + '11' : 'transparent' }}>
                <input type="checkbox" checked={form.target_ids.includes(c.id)}
                  onChange={() => toggleCourse(c.id)} />
                {c.code} — {c.name}
              </label>
            ))}
            {!courses.length && <div style={{ padding: '8px 12px', color: C.muted, fontSize: 13 }}>No courses</div>}
          </div>
        </div>
      )}

      {form.target_type === 'student' && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: 'block', marginBottom: 4 }}>
            Student Numbers (comma or newline separated)
          </label>
          <textarea style={{ ...inp, height: 80, resize: 'vertical', fontFamily: 'monospace' }}
            value={form.student_numbers}
            onChange={e => set('student_numbers', e.target.value)}
            placeholder="e.g. 202100001, 202100002" />
        </div>
      )}

      {err && <div style={{ color: C.red, fontSize: 13, marginBottom: 10 }}>{err}</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" disabled={saving}
          style={{ background: C.orange, color: '#fff', border: 'none', borderRadius: 8,
            padding: '9px 20px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
          {saving ? 'Saving…' : 'Publish'}
        </button>
        <button type="button" onClick={onCancel}
          style={{ background: 'transparent', color: C.muted, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '9px 20px', cursor: 'pointer', fontSize: 14 }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function AnnouncementDetail({ ann, onBack, onDeleted }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [editExp, setEditExp] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api(`/announcements/${ann.id}`)
      .then(d => { setDetail(d); setEditExp(d.expires_at ? d.expires_at.slice(0, 10) : ''); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ann.id]);

  useEffect(() => { load(); }, [load]);

  const togglePin = async () => {
    setPinning(true);
    try {
      await api(`/announcements/${ann.id}`, { method: 'PATCH', body: { is_pinned: !detail.is_pinned } });
      load();
    } finally { setPinning(false); }
  };

  const saveExpiry = async () => {
    await api(`/announcements/${ann.id}`, { method: 'PATCH', body: { expires_at: editExp || null } });
    setEditing(false); load();
  };

  const del = async () => {
    if (!confirm('Delete this announcement? This cannot be undone.')) return;
    await api(`/announcements/${ann.id}`, { method: 'DELETE' });
    onDeleted();
  };

  const csvUrl = `/api/v1/announcements/${ann.id}/receipts.csv`;

  if (loading) return <div style={{ padding: 40, color: C.muted }}>Loading…</div>;
  if (!detail) return null;

  return (
    <div>
      <button onClick={onBack}
        style={{ background: 'transparent', border: 'none', color: C.orange, fontWeight: 600,
          cursor: 'pointer', fontSize: 14, padding: '0 0 16px' }}>
        ← Back to list
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        {/* Main */}
        <div>
          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                {detail.is_pinned && <Badge color={C.brown}>📌 Pinned</Badge>}
                {isExpired(detail.expires_at) && <Badge color={C.red}>Expired</Badge>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={togglePin} disabled={pinning}
                  style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8,
                    padding: '6px 14px', cursor: 'pointer', fontSize: 13, color: C.muted }}>
                  {detail.is_pinned ? 'Unpin' : 'Pin'}
                </button>
                <button onClick={del}
                  style={{ background: 'transparent', border: `1px solid ${C.red}`, borderRadius: 8,
                    padding: '6px 14px', cursor: 'pointer', fontSize: 13, color: C.red }}>
                  Delete
                </button>
              </div>
            </div>

            <h2 style={{ margin: '0 0 8px', fontSize: 20, color: C.dark }}>{detail.title}</h2>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>
              Published {fmtFull(detail.created_at)} · Target: {TARGET_LABELS[detail.target_type]}
            </div>

            <div style={{ fontSize: 14, color: C.dark, lineHeight: 1.7, whiteSpace: 'pre-wrap',
              background: C.cream, borderRadius: 8, padding: 16 }}>
              {detail.content}
            </div>

            {detail.targets?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6 }}>Targets</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {detail.targets.map(t => (
                    <Badge key={t.id} color={C.dark}>
                      {detail.target_type === 'course' ? t.code : t.student_number}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Expiry */}
          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 13, color: C.dark, marginBottom: 10 }}>Expiry</div>
            {editing ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="date" value={editExp} onChange={e => setEditExp(e.target.value)}
                  style={{ flex: 1, padding: '6px 10px', border: `1px solid ${C.border}`,
                    borderRadius: 6, fontSize: 13 }} />
                <button onClick={saveExpiry}
                  style={{ background: C.orange, color: '#fff', border: 'none', borderRadius: 6,
                    padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>Save</button>
                <button onClick={() => setEditing(false)}
                  style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 6,
                    padding: '6px 10px', cursor: 'pointer', fontSize: 13, color: C.muted }}>✕</button>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: detail.expires_at ? C.dark : C.muted }}>
                  {detail.expires_at ? fmtDate(detail.expires_at) : 'Never expires'}
                </span>
                <button onClick={() => setEditing(true)}
                  style={{ background: 'transparent', border: 'none', color: C.orange,
                    cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Edit</button>
              </div>
            )}
          </div>

          {/* Read receipts */}
          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: C.dark }}>
                Read Receipts ({detail.receipts?.length || 0})
              </div>
              <a href={csvUrl} download
                style={{ fontSize: 12, color: C.orange, fontWeight: 600, textDecoration: 'none' }}>
                ↓ CSV
              </a>
            </div>
            {detail.receipts?.length === 0 && (
              <div style={{ fontSize: 13, color: C.muted }}>No reads yet.</div>
            )}
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              {detail.receipts?.map((r, i) => (
                <div key={i} style={{ padding: '6px 0', borderBottom: i < detail.receipts.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{r.student_name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{r.student_number} · {fmtFull(r.read_at)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = () => {
    setLoading(true);
    api('/announcements').then(d => setList(d)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (selected) {
    return (
      <AnnouncementDetail
        ann={selected}
        onBack={() => { setSelected(null); load(); }}
        onDeleted={() => { setSelected(null); load(); }}
      />
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: C.dark }}>Announcements</h2>
        {!creating && (
          <button onClick={() => setCreating(true)}
            style={{ background: C.orange, color: '#fff', border: 'none', borderRadius: 8,
              padding: '9px 18px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
            + New Announcement
          </button>
        )}
      </div>

      {creating && (
        <CreateForm
          onSave={() => { setCreating(false); load(); }}
          onCancel={() => setCreating(false)}
        />
      )}

      {loading && <div style={{ color: C.muted, padding: 20 }}>Loading…</div>}

      {!loading && list.length === 0 && !creating && (
        <div style={{ textAlign: 'center', padding: 60, color: C.muted }}>
          No announcements yet. Create one to notify students.
        </div>
      )}

      {list.map(ann => (
        <div key={ann.id}
          onClick={() => setSelected(ann)}
          style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12,
            padding: '14px 18px', marginBottom: 10, cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: 12, transition: 'box-shadow 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              {ann.is_pinned && <span style={{ fontSize: 13 }}>📌</span>}
              <span style={{ fontWeight: 600, fontSize: 14, color: C.dark,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ann.title}
              </span>
              {isExpired(ann.expires_at) && <Badge color={C.red}>Expired</Badge>}
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>
              {TARGET_LABELS[ann.target_type]} · {ann.target_summary} · {fmtDate(ann.created_at)}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.green }}>{ann.read_count}</div>
            <div style={{ fontSize: 11, color: C.muted }}>reads</div>
          </div>
          <div style={{ color: C.muted, fontSize: 18 }}>›</div>
        </div>
      ))}
    </div>
  );
}
