import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs/promises';
import { db, logAudit } from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { sendQueryStatusEmail, sendQueryReplyEmail } from '../config/mail.js';

const router = Router();
const fail = (res, code, msg, status = 400) =>
  res.status(status).json({ ok: false, error: { code, message: msg } });

const ALLOWED_EXT = ['.pdf', '.jpg', '.jpeg', '.png', '.docx', '.xlsx'];
const queryUpload = multer({
  dest: path.join(process.env.UPLOAD_PATH || 'uploads', 'queries'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const ok = ALLOWED_EXT.includes(ext);
    cb(ok ? null : new Error(`File type not allowed. Use: ${ALLOWED_EXT.join(', ')}`), ok);
  },
});

// ── Shared: categories (any authenticated user) ───────────────────────────────

router.get('/categories', requireAuth, async (_req, res, next) => {
  try {
    const cats = await db('query_categories').where({ is_active: true }).orderBy('id');
    res.json({ ok: true, data: cats });
  } catch (err) { next(err); }
});

// ── Admin: query stats ────────────────────────────────────────────────────────

router.get('/stats', requireAuth, requireRole('super_admin'), async (_req, res, next) => {
  try {
    const rows = await db('queries')
      .select('status')
      .count('* as count')
      .groupBy('status');
    const stats = { new: 0, acknowledged: 0, in_progress: 0, resolved: 0, closed: 0, total: 0 };
    rows.forEach(r => { stats[r.status] = Number(r.count); stats.total += Number(r.count); });
    stats.open = stats.new + stats.acknowledged + stats.in_progress;
    res.json({ ok: true, data: stats });
  } catch (err) { next(err); }
});

// ── Admin: query list ─────────────────────────────────────────────────────────

router.get('/', requireAuth, requireRole('super_admin'), async (req, res, next) => {
  try {
    const { status, course_id, category_id, urgency, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let q = db('queries as q')
      .join('students as s', 's.id', 'q.student_id')
      .join('courses as c', 'c.id', 'q.course_id')
      .join('query_categories as cat', 'cat.id', 'q.category_id')
      .orderBy('q.updated_at', 'desc');

    if (status) {
      const statuses = status.split(',').map(s => s.trim());
      q = q.whereIn('q.status', statuses);
    }
    if (course_id)   q = q.where('q.course_id', course_id);
    if (category_id) q = q.where('q.category_id', category_id);
    if (urgency)     q = q.where('q.urgency', urgency);
    if (search) {
      const like = `%${search}%`;
      q = q.where(function () {
        this.where('q.subject', 'like', like)
          .orWhere('s.surname', 'like', like)
          .orWhere('s.names', 'like', like)
          .orWhere('s.student_number', 'like', like);
      });
    }

    const [{ total }] = await q.clone().count('q.id as total');
    const queries = await q
      .offset(offset)
      .limit(parseInt(limit))
      .select(
        'q.id', 'q.subject', 'q.status', 'q.urgency', 'q.initial_channel',
        'q.created_at', 'q.updated_at', 'q.file_name',
        'cat.name as category',
        db.raw("CONCAT(s.surname, ', ', s.names) as student_name"),
        's.student_number', 's.email as student_email', 's.phone as student_phone',
        'c.code as course_code', 'c.name as course_name',
        db.raw('(SELECT COUNT(*) FROM query_messages qm WHERE qm.query_id = q.id) as message_count'),
      );

    res.json({ ok: true, data: { total: Number(total), page: parseInt(page), limit: parseInt(limit), queries } });
  } catch (err) { next(err); }
});

// ── Admin: query detail ───────────────────────────────────────────────────────

router.get('/:id', requireAuth, requireRole('super_admin'), async (req, res, next) => {
  try {
    const query = await db('queries as q')
      .join('students as s', 's.id', 'q.student_id')
      .join('courses as c', 'c.id', 'q.course_id')
      .join('query_categories as cat', 'cat.id', 'q.category_id')
      .where('q.id', req.params.id)
      .select(
        'q.*',
        'cat.name as category',
        db.raw("CONCAT(s.surname, ', ', s.names) as student_name"),
        's.student_number', 's.email as student_email', 's.phone as student_phone',
        's.names as student_names', 's.surname as student_surname',
        'c.code as course_code', 'c.name as course_name',
      )
      .first();
    if (!query) return fail(res, 'NOT_FOUND', 'Query not found', 404);

    const messages = await db('query_messages').where({ query_id: query.id }).orderBy('created_at');
    const statusHistory = await db('query_status_history').where({ query_id: query.id }).orderBy('changed_at');
    const interactions = await db('interaction_logs').where({ query_id: query.id }).orderBy('logged_at', 'desc');

    res.json({ ok: true, data: { query, messages, statusHistory, interactions } });
  } catch (err) { next(err); }
});

// ── Admin: add message or private note ────────────────────────────────────────

router.post('/:id/messages', requireAuth, requireRole('super_admin'), queryUpload.single('file'), async (req, res, next) => {
  try {
    const query = await db('queries').where({ id: req.params.id }).first();
    if (!query) { if (req.file) await fs.unlink(req.file.path).catch(() => {}); return fail(res, 'NOT_FOUND', 'Query not found', 404); }
    if (query.status === 'closed') { if (req.file) await fs.unlink(req.file.path).catch(() => {}); return fail(res, 'QUERY_CLOSED', 'Cannot add messages to a closed query'); }

    const { message, is_public } = req.body || {};
    if (!message?.trim()) { if (req.file) await fs.unlink(req.file.path).catch(() => {}); return fail(res, 'MISSING_FIELDS', 'Message text required'); }

    const isPublic = is_public === 'true' || is_public === true || is_public === '1' || is_public === 1;

    const [id] = await db('query_messages').insert({
      query_id: query.id,
      sender_type: 'admin',
      sender_id: req.user.sub,
      message: message.trim(),
      is_public: isPublic ? 1 : 0,
      file_path: req.file?.path || null,
      file_name: req.file?.originalname || null,
    });
    await db('queries').where({ id: query.id }).update({ updated_at: db.fn.now() });

    // Email student on public reply
    if (isPublic) {
      const student = await db('students').where({ id: query.student_id }).first();
      if (student?.email) {
        sendQueryReplyEmail(student.email, `${student.names} ${student.surname}`, query.subject).catch(e => console.error('Reply email failed:', e.message));
      }
    }

    await logAudit(req.user.sub, 'query.message_added', 'query', query.id, { is_public: isPublic });
    res.status(201).json({ ok: true, data: { id } });
  } catch (err) {
    if (req.file) await fs.unlink(req.file.path).catch(() => {});
    next(err);
  }
});

// ── Admin: change status ──────────────────────────────────────────────────────

router.patch('/:id/status', requireAuth, requireRole('super_admin'), async (req, res, next) => {
  try {
    const query = await db('queries').where({ id: req.params.id }).first();
    if (!query) return fail(res, 'NOT_FOUND', 'Query not found', 404);

    const { status, notes } = req.body || {};
    const VALID = ['new', 'acknowledged', 'in_progress', 'resolved', 'closed'];
    if (!VALID.includes(status)) return fail(res, 'INVALID_STATUS', `Status must be one of: ${VALID.join(', ')}`);
    if (query.status === status) return fail(res, 'NO_CHANGE', 'Query already has that status');

    const updates = { status, updated_at: db.fn.now() };
    if (status === 'closed') updates.closed_at = db.fn.now();

    await db('queries').where({ id: query.id }).update(updates);
    await db('query_status_history').insert({
      query_id: query.id, old_status: query.status, new_status: status,
      changed_by: req.user.sub, notes: notes || null,
    });

    // Email student
    const student = await db('students').where({ id: query.student_id }).first();
    if (student?.email) {
      const displayName = student.names ? `${student.names}` : student.student_number;
      sendQueryStatusEmail(student.email, displayName, query.subject, status)
        .catch(e => console.error('Status email failed:', e.message));
    }

    await logAudit(req.user.sub, 'query.status_changed', 'query', query.id, { from: query.status, to: status });
    res.json({ ok: true, data: { status } });
  } catch (err) { next(err); }
});

// ── Admin: log external interaction ──────────────────────────────────────────

router.post('/:id/interactions', requireAuth, requireRole('super_admin'), async (req, res, next) => {
  try {
    const query = await db('queries').where({ id: req.params.id }).first();
    if (!query) return fail(res, 'NOT_FOUND', 'Query not found', 404);

    const { channel, direction, summary } = req.body || {};
    const CHANNELS = ['whatsapp', 'email', 'blackboard', 'f2f', 'system_message'];
    const DIRECTIONS = ['sent', 'received', 'n/a'];
    if (!CHANNELS.includes(channel)) return fail(res, 'INVALID_CHANNEL', `Channel must be one of: ${CHANNELS.join(', ')}`);
    if (!summary?.trim()) return fail(res, 'MISSING_FIELDS', 'Summary required');

    const [id] = await db('interaction_logs').insert({
      student_id: query.student_id,
      query_id: query.id,
      channel,
      direction: DIRECTIONS.includes(direction) ? direction : 'n/a',
      summary: summary.trim(),
      logged_by: req.user.sub,
    });
    await logAudit(req.user.sub, 'interaction.logged', 'query', query.id, { channel });
    res.status(201).json({ ok: true, data: { id } });
  } catch (err) { next(err); }
});

// ── Admin: serve query file ───────────────────────────────────────────────────

router.get('/:id/file', requireAuth, async (req, res, next) => {
  try {
    const query = await db('queries').where({ id: req.params.id }).first();
    if (!query?.file_path) return fail(res, 'NOT_FOUND', 'No attachment', 404);
    if (req.user.role === 'student' && query.student_id !== req.user.sub)
      return fail(res, 'FORBIDDEN', 'Access denied', 403);
    res.download(query.file_path, query.file_name || 'attachment');
  } catch (err) { next(err); }
});

router.get('/:id/messages/:msgId/file', requireAuth, async (req, res, next) => {
  try {
    const msg = await db('query_messages').where({ id: req.params.msgId, query_id: req.params.id }).first();
    if (!msg?.file_path) return fail(res, 'NOT_FOUND', 'No attachment', 404);
    if (req.user.role === 'student') {
      const query = await db('queries').where({ id: req.params.id }).first();
      if (query?.student_id !== req.user.sub || !msg.is_public)
        return fail(res, 'FORBIDDEN', 'Access denied', 403);
    }
    res.download(msg.file_path, msg.file_name || 'attachment');
  } catch (err) { next(err); }
});

// ── Student: submit query ─────────────────────────────────────────────────────

router.post('/student', requireAuth, requireRole('student'), queryUpload.single('file'), async (req, res, next) => {
  try {
    const { course_id, category_id, subject, description, urgency, initial_channel } = req.body || {};
    if (!course_id || !category_id || !subject?.trim() || !description?.trim())
      return fail(res, 'MISSING_FIELDS', 'course_id, category_id, subject and description required');

    // Verify student is enrolled in the course
    const enrolled = await db('course_enrollments').where({ student_id: req.user.sub, course_id }).first();
    if (!enrolled) { if (req.file) await fs.unlink(req.file.path).catch(() => {}); return fail(res, 'NOT_ENROLLED', 'You are not enrolled in that course', 403); }

    const URGENCIES = ['low', 'medium', 'high', 'urgent'];
    const CHANNELS = ['whatsapp', 'email', 'blackboard', 'in_person', 'portal'];

    const [id] = await db('queries').insert({
      student_id: req.user.sub,
      course_id: parseInt(course_id),
      category_id: parseInt(category_id),
      subject: subject.trim(),
      description: description.trim(),
      urgency: URGENCIES.includes(urgency) ? urgency : 'medium',
      initial_channel: CHANNELS.includes(initial_channel) ? initial_channel : 'portal',
      file_path: req.file?.path || null,
      file_name: req.file?.originalname || null,
      status: 'new',
    });
    await logAudit(req.user.sub, 'query.submitted', 'query', id, { subject: subject.trim() });
    res.status(201).json({ ok: true, data: { id } });
  } catch (err) {
    if (req.file) await fs.unlink(req.file.path).catch(() => {});
    next(err);
  }
});

// ── Student: list own queries ─────────────────────────────────────────────────

router.get('/student', requireAuth, requireRole('student'), async (req, res, next) => {
  try {
    const queries = await db('queries as q')
      .join('courses as c', 'c.id', 'q.course_id')
      .join('query_categories as cat', 'cat.id', 'q.category_id')
      .where('q.student_id', req.user.sub)
      .orderBy('q.updated_at', 'desc')
      .select(
        'q.id', 'q.subject', 'q.status', 'q.urgency', 'q.created_at', 'q.updated_at',
        'cat.name as category', 'c.code as course_code', 'c.name as course_name',
        db.raw('(SELECT COUNT(*) FROM query_messages qm WHERE qm.query_id = q.id AND qm.is_public = 1) as reply_count'),
      );
    res.json({ ok: true, data: queries });
  } catch (err) { next(err); }
});

// ── Student: own query detail ─────────────────────────────────────────────────

router.get('/student/:id', requireAuth, requireRole('student'), async (req, res, next) => {
  try {
    const query = await db('queries as q')
      .join('courses as c', 'c.id', 'q.course_id')
      .join('query_categories as cat', 'cat.id', 'q.category_id')
      .where('q.id', req.params.id)
      .where('q.student_id', req.user.sub)
      .select('q.*', 'cat.name as category', 'c.code as course_code', 'c.name as course_name')
      .first();
    if (!query) return fail(res, 'NOT_FOUND', 'Query not found', 404);

    const messages = await db('query_messages')
      .where({ query_id: query.id, is_public: 1 })
      .orderBy('created_at');
    const statusHistory = await db('query_status_history')
      .where({ query_id: query.id })
      .orderBy('changed_at');

    res.json({ ok: true, data: { query, messages, statusHistory } });
  } catch (err) { next(err); }
});

export default router;
