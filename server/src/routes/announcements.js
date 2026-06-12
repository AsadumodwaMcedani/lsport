import { Router } from 'express';
import { db, logAudit } from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const fail = (res, code, msg, status = 400) =>
  res.status(status).json({ ok: false, error: { code, message: msg } });

// ── Shared helper: resolve target summary string ──────────────────────────────

async function targetSummary(ann) {
  if (ann.target_type === 'all') return 'All Students';
  const targets = await db('announcement_targets').where({ announcement_id: ann.id });
  if (!targets.length) return ann.target_type === 'course' ? 'No courses' : 'No students';
  if (ann.target_type === 'course') {
    const courses = await db('courses').whereIn('id', targets.map(t => t.target_id)).select('code');
    return courses.map(c => c.code).join(', ');
  }
  return `${targets.length} student${targets.length === 1 ? '' : 's'}`;
}

// ── Student: list visible announcements (with read status) ────────────────────

router.get('/student', requireAuth, requireRole('student'), async (req, res, next) => {
  try {
    const studentId = req.user.sub;

    const rows = await db('announcements as a')
      .where(function () {
        this.where('a.target_type', 'all')
          .orWhere(function () {
            this.where('a.target_type', 'course')
              .whereExists(
                db('announcement_targets as at')
                  .join('course_enrollments as ce', 'ce.course_id', 'at.target_id')
                  .whereRaw('at.announcement_id = a.id')
                  .where('ce.student_id', studentId)
              );
          })
          .orWhere(function () {
            this.where('a.target_type', 'student')
              .whereExists(
                db('announcement_targets as at')
                  .whereRaw('at.announcement_id = a.id')
                  .where('at.target_id', studentId)
              );
          });
      })
      .where(function () {
        this.whereNull('a.expires_at').orWhere('a.expires_at', '>', db.fn.now());
      })
      .leftJoin('announcement_read_receipts as arr', function () {
        this.on('arr.announcement_id', 'a.id').andOnVal('arr.student_id', studentId);
      })
      .orderBy([{ column: 'a.is_pinned', order: 'desc' }, { column: 'a.created_at', order: 'desc' }])
      .select('a.id', 'a.title', 'a.content', 'a.is_pinned', 'a.created_at',
        db.raw('arr.read_at IS NOT NULL as is_read'));

    res.json({ ok: true, data: rows });
  } catch (err) { next(err); }
});

// ── Student: mark announcement as read ────────────────────────────────────────

router.post('/:id/read', requireAuth, requireRole('student'), async (req, res, next) => {
  try {
    const ann = await db('announcements').where({ id: req.params.id }).first();
    if (!ann) return fail(res, 'NOT_FOUND', 'Announcement not found', 404);
    await db('announcement_read_receipts')
      .insert({ announcement_id: ann.id, student_id: req.user.sub })
      .onConflict(['announcement_id', 'student_id']).ignore();
    res.json({ ok: true, data: { read: true } });
  } catch (err) { next(err); }
});

// ── Admin: list all announcements ─────────────────────────────────────────────

router.get('/', requireAuth, requireRole('super_admin'), async (req, res, next) => {
  try {
    const rows = await db('announcements as a')
      .orderBy([{ column: 'a.is_pinned', order: 'desc' }, { column: 'a.created_at', order: 'desc' }])
      .select(
        'a.id', 'a.title', 'a.target_type', 'a.is_pinned', 'a.expires_at', 'a.created_at',
        db.raw('(SELECT COUNT(*) FROM announcement_read_receipts arr WHERE arr.announcement_id = a.id) as read_count'),
      );

    const list = await Promise.all(rows.map(async r => ({
      ...r,
      read_count: Number(r.read_count),
      target_summary: await targetSummary(r),
    })));

    res.json({ ok: true, data: list });
  } catch (err) { next(err); }
});

// ── Admin: get announcement detail (with targets + receipts) ──────────────────

router.get('/:id', requireAuth, requireRole('super_admin'), async (req, res, next) => {
  try {
    const ann = await db('announcements').where({ id: req.params.id }).first();
    if (!ann) return fail(res, 'NOT_FOUND', 'Announcement not found', 404);

    const targets = await db('announcement_targets').where({ announcement_id: ann.id });
    const receipts = await db('announcement_read_receipts as arr')
      .join('students as s', 's.id', 'arr.student_id')
      .where('arr.announcement_id', ann.id)
      .orderBy('arr.read_at', 'desc')
      .select('s.student_number', db.raw("CONCAT(s.surname, ', ', s.names) as student_name"), 'arr.read_at');

    let targetDetails = [];
    if (ann.target_type === 'course' && targets.length) {
      targetDetails = await db('courses').whereIn('id', targets.map(t => t.target_id)).select('id', 'code', 'name');
    } else if (ann.target_type === 'student' && targets.length) {
      targetDetails = await db('students').whereIn('id', targets.map(t => t.target_id))
        .select('id', 'student_number', db.raw("CONCAT(surname, ', ', names) as student_name"));
    }

    res.json({ ok: true, data: { ...ann, targets: targetDetails, receipts } });
  } catch (err) { next(err); }
});

// ── Admin: create announcement ────────────────────────────────────────────────

router.post('/', requireAuth, requireRole('super_admin'), async (req, res, next) => {
  try {
    const { title, content, target_type, target_ids, student_numbers, is_pinned, expires_at } = req.body || {};
    if (!title?.trim()) return fail(res, 'MISSING_FIELDS', 'Title required');
    if (!content?.trim()) return fail(res, 'MISSING_FIELDS', 'Content required');
    const TYPES = ['all', 'course', 'student'];
    if (!TYPES.includes(target_type)) return fail(res, 'INVALID_TARGET', 'target_type must be all, course, or student');

    const [id] = await db('announcements').insert({
      title: title.trim(),
      content: content.trim(),
      target_type,
      is_pinned: is_pinned ? 1 : 0,
      expires_at: expires_at || null,
      created_by: req.user.sub,
    });

    if (target_type === 'course' && Array.isArray(target_ids) && target_ids.length) {
      await db('announcement_targets').insert(
        target_ids.map(cid => ({ announcement_id: id, target_id: parseInt(cid) }))
      );
    } else if (target_type === 'student') {
      const nums = (student_numbers || '').split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
      if (nums.length) {
        const students = await db('students').whereIn('student_number', nums).select('id');
        if (students.length) {
          await db('announcement_targets').insert(
            students.map(s => ({ announcement_id: id, target_id: s.id }))
          );
        }
      }
    }

    await logAudit(req.user.sub, 'announcement.created', 'announcement', id, { title: title.trim(), target_type });
    res.status(201).json({ ok: true, data: { id } });
  } catch (err) { next(err); }
});

// ── Admin: update announcement ────────────────────────────────────────────────

router.patch('/:id', requireAuth, requireRole('super_admin'), async (req, res, next) => {
  try {
    const ann = await db('announcements').where({ id: req.params.id }).first();
    if (!ann) return fail(res, 'NOT_FOUND', 'Announcement not found', 404);

    const { title, content, is_pinned, expires_at } = req.body || {};
    const updates = {};
    if (title !== undefined) updates.title = title.trim();
    if (content !== undefined) updates.content = content.trim();
    if (is_pinned !== undefined) updates.is_pinned = is_pinned ? 1 : 0;
    if (expires_at !== undefined) updates.expires_at = expires_at || null;

    if (Object.keys(updates).length) {
      await db('announcements').where({ id: ann.id }).update({ ...updates, updated_at: db.fn.now() });
    }
    await logAudit(req.user.sub, 'announcement.updated', 'announcement', ann.id, updates);
    res.json({ ok: true, data: { updated: true } });
  } catch (err) { next(err); }
});

// ── Admin: delete announcement ────────────────────────────────────────────────

router.delete('/:id', requireAuth, requireRole('super_admin'), async (req, res, next) => {
  try {
    const ann = await db('announcements').where({ id: req.params.id }).first();
    if (!ann) return fail(res, 'NOT_FOUND', 'Announcement not found', 404);
    await db('announcements').where({ id: ann.id }).delete();
    await logAudit(req.user.sub, 'announcement.deleted', 'announcement', ann.id, { title: ann.title });
    res.json({ ok: true, data: { deleted: true } });
  } catch (err) { next(err); }
});

// ── Admin: download read receipts as CSV ──────────────────────────────────────

router.get('/:id/receipts.csv', requireAuth, requireRole('super_admin'), async (req, res, next) => {
  try {
    const ann = await db('announcements').where({ id: req.params.id }).first();
    if (!ann) return fail(res, 'NOT_FOUND', 'Announcement not found', 404);

    const receipts = await db('announcement_read_receipts as arr')
      .join('students as s', 's.id', 'arr.student_id')
      .where('arr.announcement_id', ann.id)
      .orderBy('arr.read_at')
      .select('s.student_number', 's.surname', 's.names', 's.email', 'arr.read_at');

    const lines = ['Student Number,Surname,Names,Email,Read At'];
    receipts.forEach(r => {
      lines.push([r.student_number, r.surname, r.names, r.email || '',
        new Date(r.read_at).toISOString()].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    });

    const filename = `receipts_${ann.id}_${ann.title.replace(/[^a-z0-9]/gi, '_').slice(0, 30)}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(lines.join('\r\n'));
  } catch (err) { next(err); }
});

export default router;
