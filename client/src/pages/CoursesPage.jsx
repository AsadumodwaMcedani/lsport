import React, { useState, useEffect, useRef } from 'react';
import { api, apiUpload } from '../lib/api.js';

export default function CoursesPage() {
  const [courses, setCourses]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [uploadCourse, setUpload] = useState(null); // course obj to upload to

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { const d = await api('/courses'); setCourses(d); }
    finally { setLoading(false); }
  }

  return (
    <div style={s.page}>
      <div style={s.toolbar}>
        <div style={s.toolbarLeft}>
          <h2 style={s.heading}>Courses</h2>
          <span style={s.count}>{courses.length} course{courses.length !== 1 ? 's' : ''}</span>
        </div>
        <button style={s.btn} onClick={() => setShowForm(true)}>+ New Course</button>
      </div>

      {showForm && <CreateCourseForm onCreated={() => { setShowForm(false); load(); }} onCancel={() => setShowForm(false)} />}

      {loading ? <Skeleton /> : courses.length === 0
        ? <Empty />
        : <CourseTable courses={courses} onUpload={setUpload} onRefresh={load} />}

      {uploadCourse && <UploadModal course={uploadCourse} onDone={() => { setUpload(null); load(); }} onClose={() => setUpload(null)} />}
    </div>
  );
}

/* ── Create Course Form ── */
function CreateCourseForm({ onCreated, onCancel }) {
  const cur = new Date();
  const [form, setForm] = useState({ code: '', name: '', year: cur.getFullYear(), semester_number: 1, description: '', delivery_type: '', course_provider: 'lbbs', course_provider_other: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await api('/courses', { method: 'POST', body: form }); onCreated(); }
    catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  }

  return (
    <div style={s.formCard}>
      <h3 style={s.formTitle}>New Course</h3>
      {err && <div style={s.error}>{err}</div>}
      <form onSubmit={submit} style={s.formGrid}>
        <Field label="Course Code *"><input style={s.input} value={form.code} onChange={set('code')} placeholder="e.g. ITS301" required /></Field>
        <Field label="Course Name *"><input style={s.input} value={form.name} onChange={set('name')} placeholder="e.g. Information Systems 3" required /></Field>
        <Field label="Year *"><input style={s.input} type="number" value={form.year} onChange={set('year')} min="2020" max="2099" required /></Field>
        <Field label="Semester *">
          <select style={s.input} value={form.semester_number} onChange={set('semester_number')}>
            <option value={1}>Semester 1</option>
            <option value={2}>Semester 2</option>
          </select>
        </Field>
        <Field label="Delivery Type">
          <select style={s.input} value={form.delivery_type} onChange={set('delivery_type')}>
            <option value="">— Not specified —</option>
            <option value="year_round">Year Round</option>
            <option value="online_always">Online (Always Available)</option>
          </select>
        </Field>
        <Field label="Course Provider *">
          <select style={s.input} value={form.course_provider} onChange={set('course_provider')} required>
            <option value="lbbs">LBBS Course</option>
            <option value="ufh">UFH Course</option>
            <option value="other">Other</option>
          </select>
        </Field>
        {form.course_provider === 'other' && (
          <div style={{ gridColumn: '1/-1' }}>
            <Field label="Specify Provider *">
              <input style={s.input} value={form.course_provider_other} onChange={set('course_provider_other')} placeholder="Enter provider name" required />
            </Field>
          </div>
        )}
        <div style={{ gridColumn: '1/-1' }}>
          <Field label="Description"><input style={s.input} value={form.description} onChange={set('description')} placeholder="Optional" /></Field>
        </div>
        <div style={{ gridColumn: '1/-1', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" style={s.btnGhost} onClick={onCancel}>Cancel</button>
          <button style={s.btn} disabled={busy}>{busy ? 'Saving…' : 'Create Course'}</button>
        </div>
      </form>
    </div>
  );
}

/* ── Course Table ── */
function CourseTable({ courses, onUpload }) {
  return (
    <div style={s.tableWrap}>
      <table style={s.table}>
        <thead><tr>{['Code','Name','Year','Sem','Students','Status','Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr></thead>
        <tbody>
          {courses.map(c => (
            <tr key={c.id} style={s.tr}>
              <td style={s.td}><span style={s.code}>{c.code}</span></td>
              <td style={s.td}>{c.name}</td>
              <td style={s.td}>{c.year}</td>
              <td style={s.td}>S{c.semester_number}</td>
              <td style={s.td}><span style={s.badge}>{c.enrolled_count}</span></td>
              <td style={s.td}><span style={{ ...s.status, ...(c.is_active ? s.active : s.inactive) }}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
              <td style={s.td}>
                <button style={s.uploadBtn} onClick={() => onUpload(c)}>Upload Class List</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Upload Modal ── */
function UploadModal({ course, onDone, onClose }) {
  const [step, setStep]         = useState('pick');   // pick → map → result
  const [file, setFile]         = useState(null);
  const [parsed, setParsed]     = useState(null);     // { headers, preview, suggested }
  const [mapping, setMapping]   = useState({});
  const [result, setResult]     = useState(null);
  const [busy, setBusy]         = useState(false);
  const [err, setErr]           = useState('');
  const fileRef = useRef();

  const FIELDS = [
    { key: 'student_number', label: 'Student Number', required: true },
    { key: 'surname',        label: 'Surname',         required: true },
    { key: 'names',          label: 'First Names',     required: true },
    { key: 'id_number',      label: 'ID Number',       required: false },
    { key: 'email',          label: 'Email',           required: false },
    { key: 'phone',          label: 'Phone',           required: false },
    { key: 'course_name',    label: 'Course Name',     required: false },
    { key: 'qualification',  label: 'Qualification',   required: false },
  ];

  async function parse() {
    if (!file) return;
    setBusy(true); setErr('');
    try {
      const fd = new FormData(); fd.append('file', file);
      const d = await apiUpload(`/courses/${course.id}/upload/parse`, fd);
      setParsed(d);
      setMapping(d.suggested || {});
      setStep('map');
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  }

  async function runImport() {
    setBusy(true); setErr('');
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('column_map', JSON.stringify(mapping));
      const d = await apiUpload(`/courses/${course.id}/upload/import`, fd);
      setResult(d);
      setStep('result');
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  }

  return (
    <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={s.modal}>
        <div style={s.modalHeader}>
          <div>
            <div style={s.modalTitle}>Upload Class List</div>
            <div style={s.modalSub}>{course.code} — {course.name}</div>
          </div>
          <button style={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        {err && <div style={s.error}>{err}</div>}

        {step === 'pick' && (
          <div>
            <p style={s.hint}>Upload an Excel (.xlsx) file. Student accounts will be created automatically. Initial password = last 5 digits of student number.</p>
            <div style={s.dropzone} onClick={() => fileRef.current.click()}>
              {file ? <><span style={{ fontSize: '1.5rem' }}>📄</span><span>{file.name}</span></> : <><span style={{ fontSize: '2rem' }}>📂</span><span style={{ color: '#6b7280' }}>Click to select .xlsx file</span></>}
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button style={s.btnGhost} onClick={onClose}>Cancel</button>
              <button style={s.btn} disabled={!file || busy} onClick={parse}>{busy ? 'Parsing…' : 'Next: Map Columns →'}</button>
            </div>
          </div>
        )}

        {step === 'map' && parsed && (
          <div>
            <p style={s.hint}>Map your Excel columns to the correct fields. Required fields are marked *.</p>
            <div style={s.mapGrid}>
              {FIELDS.map(({ key, label, required }) => (
                <div key={key} style={s.mapRow}>
                  <label style={s.mapLabel}>{label}{required ? ' *' : ''}</label>
                  <select style={s.input} value={mapping[key] ?? ''} onChange={e => setMapping(m => ({ ...m, [key]: e.target.value === '' ? undefined : parseInt(e.target.value) }))}>
                    <option value="">— skip —</option>
                    {parsed.headers.map((h, i) => <option key={i} value={i}>{h || `Column ${i + 1}`}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {parsed.preview.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={s.previewLabel}>Preview (first {parsed.preview.length} rows)</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ ...s.table, fontSize: '0.78rem' }}>
                    <thead><tr>{parsed.headers.map((h, i) => <th key={i} style={s.th}>{h || `Col ${i+1}`}</th>)}</tr></thead>
                    <tbody>{parsed.preview.map((row, ri) => <tr key={ri}>{parsed.headers.map((_, ci) => <td key={ci} style={s.td}>{row[ci] ?? ''}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button style={s.btnGhost} onClick={() => setStep('pick')}>← Back</button>
              <button style={s.btn} disabled={busy} onClick={runImport}>{busy ? 'Importing…' : 'Import Students'}</button>
            </div>
          </div>
        )}

        {step === 'result' && result && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✅</div>
            <h3 style={{ color: '#1F2937', margin: '0 0 8px' }}>Import Complete</h3>
            <p style={{ color: '#6b7280', marginBottom: 20 }}><strong>{result.created}</strong> new student{result.created !== 1 ? 's' : ''} created &nbsp;·&nbsp; <strong>{result.updated}</strong> updated</p>
            {result.errors?.length > 0 && <div style={s.error}>{result.errors.length} row{result.errors.length !== 1 ? 's' : ''} had errors (skipped)</div>}
            <button style={s.btn} onClick={onDone}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) { return <div><label style={s.label}>{label}</label>{children}</div>; }
function Skeleton() { return <div style={{ opacity: 0.5 }}>{[...Array(3)].map((_, i) => <div key={i} style={{ ...s.skRow, animationDelay: `${i * 0.1}s` }} />)}</div>; }
function Empty() { return <div style={s.empty}><div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📚</div><p style={{ color: '#9ca3af' }}>No courses yet. Create one to get started.</p></div>; }

const s = {
  page:    { animation: 'fadeUp 0.3s ease' },
  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  toolbarLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  heading: { fontFamily: "'Poppins',sans-serif", fontSize: '1.1rem', fontWeight: 700, color: '#1F2937' },
  count:   { background: '#f3f4f6', color: '#6b7280', borderRadius: 20, padding: '2px 10px', fontSize: '0.8rem', fontWeight: 600 },
  btn:     { background: '#FA7921', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
  btnGhost:{ background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '9px 18px', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
  formCard:{ background: '#fff', borderRadius: 14, padding: '24px', marginBottom: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  formTitle:{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: '1rem', color: '#1F2937', marginBottom: 16 },
  formGrid:{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' },
  label:   { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#374151', marginBottom: 5 },
  input:   { display: 'block', width: '100%', padding: '9px 12px', border: '1.5px solid #e5e7eb', borderRadius: 7, fontSize: '0.88rem', boxSizing: 'border-box', fontFamily: 'inherit', color: '#1F2937' },
  error:   { background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: 8, padding: '10px 14px', fontSize: '0.85rem', marginBottom: 14 },
  hint:    { color: '#6b7280', fontSize: '0.85rem', marginBottom: 14, lineHeight: 1.5 },
  tableWrap:{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' },
  table:   { width: '100%', borderCollapse: 'collapse' },
  th:      { background: '#f9fafb', padding: '11px 14px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #f0f0f0' },
  tr:      { borderBottom: '1px solid #f9fafb' },
  td:      { padding: '12px 14px', fontSize: '0.88rem', color: '#374151' },
  code:    { background: '#f3f4f6', borderRadius: 5, padding: '2px 8px', fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 700, color: '#1F2937' },
  badge:   { background: '#eff6ff', color: '#1d4ed8', borderRadius: 20, padding: '2px 9px', fontWeight: 700, fontSize: '0.8rem' },
  status:  { borderRadius: 20, padding: '3px 10px', fontWeight: 600, fontSize: '0.78rem' },
  active:  { background: '#f0fdf4', color: '#15803d' },
  inactive:{ background: '#f9fafb', color: '#9ca3af' },
  uploadBtn:{ background: '#fff8f0', color: '#FA7921', border: '1.5px solid #FA7921', borderRadius: 7, padding: '5px 12px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 },
  modal:   { background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
  modalHeader:{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle:{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#1F2937' },
  modalSub:{ fontSize: '0.82rem', color: '#9ca3af', marginTop: 3 },
  closeBtn:{ background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', color: '#9ca3af', padding: 4 },
  dropzone:{ border: '2px dashed #e5e7eb', borderRadius: 10, padding: '32px 24px', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, transition: 'border-color 0.2s' },
  mapGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' },
  mapRow:  { display: 'flex', flexDirection: 'column', gap: 4 },
  mapLabel:{ fontSize: '0.78rem', fontWeight: 600, color: '#374151' },
  previewLabel:{ fontSize: '0.78rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 },
  skRow:   { height: 52, background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)', borderRadius: 8, marginBottom: 8, animation: 'shimmer 1.5s infinite' },
  empty:   { textAlign: 'center', padding: '60px 20px' },
};
