import { useState, useEffect } from 'react';
import { api } from '../lib/api.js';

const C = {
  orange: '#FA7921', dark: '#1F2937', cream: '#FFF8F0',
  brown: '#7D4600', yellow: '#FFE66D', muted: '#6B7280',
  border: '#E5E7EB', green: '#10B981',
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

function ReadModal({ ann, onClose, onConfirmed }) {
  const [confirming, setConfirming] = useState(false);

  const confirm = async () => {
    setConfirming(true);
    try {
      await api(`/announcements/${ann.id}/read`, { method: 'POST' });
      onConfirmed();
    } finally { setConfirming(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560,
        maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: C.dark, padding: '18px 24px', flexShrink: 0 }}>
          {ann.is_pinned && (
            <div style={{ fontSize: 11, color: C.orange, fontWeight: 700, marginBottom: 4, letterSpacing: 1 }}>
              📌 PINNED ANNOUNCEMENT
            </div>
          )}
          <div style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>{ann.title}</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
            {fmtDate(ann.created_at)}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ fontSize: 14, color: C.dark, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {ann.content}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, flexShrink: 0,
          display: 'flex', gap: 10 }}>
          {!ann.is_read ? (
            <button onClick={confirm} disabled={confirming}
              style={{ flex: 1, background: C.green, color: '#fff', border: 'none', borderRadius: 8,
                padding: '10px 0', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
              {confirming ? 'Confirming…' : '✓ I have read and understood this'}
            </button>
          ) : (
            <div style={{ flex: 1, textAlign: 'center', color: C.green, fontWeight: 600, fontSize: 14,
              padding: 10 }}>
              ✓ You have confirmed this announcement
            </div>
          )}
          <button onClick={onClose}
            style={{ background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8,
              padding: '10px 18px', cursor: 'pointer', fontSize: 14, color: C.muted }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StudentAnnouncementsPage({ onBack }) {
  const [anns, setAnns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = () => {
    setLoading(true);
    api('/announcements/student').then(d => setAnns(d)).catch(() => []).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleConfirmed = () => {
    setAnns(prev => prev.map(a => a.id === selected.id ? { ...a, is_read: 1 } : a));
    setSelected(prev => ({ ...prev, is_read: 1 }));
  };

  const pinned = anns.filter(a => a.is_pinned);
  const regular = anns.filter(a => !a.is_pinned);
  const unreadCount = anns.filter(a => !a.is_read).length;

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', padding: 20 }}>
      {selected && (
        <ReadModal
          ann={selected}
          onClose={() => { setSelected(null); }}
          onConfirmed={handleConfirmed}
        />
      )}

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={onBack}
          style={{ background: 'transparent', border: 'none', color: C.orange, fontWeight: 700,
            cursor: 'pointer', fontSize: 20, padding: 0, lineHeight: 1 }}>
          ←
        </button>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: C.dark }}>Announcements</div>
          {unreadCount > 0 && (
            <div style={{ fontSize: 12, color: C.orange, fontWeight: 600 }}>
              {unreadCount} unread
            </div>
          )}
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', color: C.muted, padding: 40 }}>Loading…</div>}

      {!loading && anns.length === 0 && (
        <div style={{ textAlign: 'center', color: C.muted, padding: 60, fontSize: 14 }}>
          No announcements at this time.
        </div>
      )}

      {pinned.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.brown, letterSpacing: 1,
            marginBottom: 8, textTransform: 'uppercase' }}>Pinned</div>
          {pinned.map(ann => <AnnouncementCard key={ann.id} ann={ann} onClick={() => setSelected(ann)} />)}
        </div>
      )}

      {regular.length > 0 && (
        <div>
          {pinned.length > 0 && (
            <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: 1,
              marginBottom: 8, marginTop: 16, textTransform: 'uppercase' }}>All Announcements</div>
          )}
          {regular.map(ann => <AnnouncementCard key={ann.id} ann={ann} onClick={() => setSelected(ann)} />)}
        </div>
      )}
    </div>
  );
}

function AnnouncementCard({ ann, onClick }) {
  const isRead = !!ann.is_read;
  return (
    <div onClick={onClick}
      style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 10,
        cursor: 'pointer', border: `1px solid ${isRead ? C.border : C.orange + '55'}`,
        borderLeft: `4px solid ${isRead ? C.border : C.orange}`, position: 'relative' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.dark, marginBottom: 4 }}>
            {ann.is_pinned && '📌 '}{ann.title}
          </div>
          <div style={{ fontSize: 12, color: C.muted }}>
            {fmtDate(ann.created_at)}
          </div>
        </div>
        <div style={{ marginLeft: 12, flexShrink: 0 }}>
          {isRead ? (
            <span style={{ fontSize: 18, color: C.green }}>✓</span>
          ) : (
            <span style={{ background: C.orange, borderRadius: '50%', width: 10, height: 10,
              display: 'inline-block' }} />
          )}
        </div>
      </div>
    </div>
  );
}
