import { Router } from 'express';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import { db, logAudit } from '../config/db.js';
import { issueToken, setAuthCookie, requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const fail = (res, code, msg, status = 400) => res.status(status).json({ ok: false, error: { code, message: msg } });

const adminLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, standardHeaders: true, message: { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again in 15 minutes.' } } });
const portalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, message: { ok: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again in 15 minutes.' } } });

// Super admin: email + password from .env (Decision #4: no TOTP in v1)
router.post('/admin/login', adminLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return fail(res, 'MISSING_FIELDS', 'Email and password required');
  const match = email.toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase()
    && await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH || '');
  if (!match) {
    await logAudit(null, 'auth.admin_login_failed', null, null, { email }, req.ip);
    return fail(res, 'BAD_CREDENTIALS', 'Invalid email or password', 401);
  }
  const token = issueToken({ sub: 0, role: 'super_admin', name: 'Lecturer' }, '8h');
  setAuthCookie(res, token, 8 * 3600 * 1000);
  await logAudit(0, 'auth.admin_login', null, null, null, req.ip);
  res.json({ ok: true, data: { role: 'super_admin' } });
});

// Staff / tutor: student number + password (users table)
router.post('/staff/login', adminLimiter, makeUserLogin(['staff']));
router.post('/tutor/login', portalLimiter, makeUserLogin(['tutor']));

function makeUserLogin(roles) {
  return async (req, res) => {
    const { student_number, password } = req.body || {};
    if (!student_number || !password) return fail(res, 'MISSING_FIELDS', 'Student number and password required');
    const user = await db('users').whereIn('role', roles).where({ student_number, is_active: 1 }).first();
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      await logAudit(null, 'auth.login_failed', 'user', null, { student_number, roles }, req.ip);
      return fail(res, 'BAD_CREDENTIALS', 'Invalid credentials', 401);
    }
    const token = issueToken({ sub: user.id, role: user.role, name: user.full_name, perms: user.permissions_json || null }, '8h');
    setAuthCookie(res, token, 8 * 3600 * 1000);
    await db('users').where({ id: user.id }).update({ last_login: db.fn.now() });
    await logAudit(user.id, 'auth.login', 'user', user.id, null, req.ip);
    res.json({ ok: true, data: { role: user.role, forcePasswordChange: !!user.force_pw_change } });
  };
}

// Forced/normal password change for users-table accounts
router.post('/change-password', requireAuth, async (req, res) => {
  const { current_password, new_password } = req.body || {};
  if (req.user.sub === 0) return fail(res, 'NOT_SUPPORTED', 'Admin password is managed in server configuration');
  if (!new_password || new_password.length < 8) return fail(res, 'WEAK_PASSWORD', 'Minimum 8 characters');
  const user = await db('users').where({ id: req.user.sub }).first();
  if (!user || !(await bcrypt.compare(current_password || '', user.password_hash))) {
    return fail(res, 'BAD_CREDENTIALS', 'Current password incorrect', 401);
  }
  await db('users').where({ id: user.id }).update({ password_hash: await bcrypt.hash(new_password, 12), force_pw_change: 0 });
  await logAudit(user.id, 'auth.password_changed', 'user', user.id, null, req.ip);
  res.json({ ok: true, data: { changed: true } });
});

// Student login: student number + course + password
router.post('/student/login', portalLimiter, async (req, res) => {
  const { student_number, course_id, password } = req.body || {};
  if (!student_number || !course_id || !password) return fail(res, 'MISSING_FIELDS', 'Student number, course and password required');

  const student = await db('students').where({ student_number, is_active: 1 }).first();
  if (!student) {
    await logAudit(null, 'auth.student_login_failed', null, null, { student_number }, req.ip);
    return fail(res, 'BAD_CREDENTIALS', 'Invalid student number or password', 401);
  }
  const enrolled = await db('course_enrollments').where({ student_id: student.id, course_id }).first();
  if (!enrolled) return fail(res, 'NOT_ENROLLED', 'You are not enrolled in that course', 403);

  if (!(await bcrypt.compare(password, student.password_hash))) {
    await logAudit(null, 'auth.student_login_failed', 'student', student.id, { student_number }, req.ip);
    return fail(res, 'BAD_CREDENTIALS', 'Invalid student number or password', 401);
  }

  const allCourseIds = (await db('course_enrollments').where({ student_id: student.id }).select('course_id')).map(r => r.course_id);
  const token = issueToken({ sub: student.id, role: 'student', name: `${student.names} ${student.surname}`, course_ids: allCourseIds }, '4h');
  setAuthCookie(res, token, 4 * 3600 * 1000);
  await db('students').where({ id: student.id }).update({ force_pw_change: student.force_pw_change });
  await logAudit(student.id, 'auth.student_login', 'student', student.id, null, req.ip);
  res.json({ ok: true, data: { role: 'student', forcePasswordChange: !!student.force_pw_change } });
});

// Student forced/voluntary password change
router.post('/student/change-password', requireAuth, requireRole('student'), async (req, res) => {
  const { current_password, new_password } = req.body || {};
  if (!new_password || new_password.length < 8) return fail(res, 'WEAK_PASSWORD', 'Minimum 8 characters');
  const student = await db('students').where({ id: req.user.sub }).first();
  if (!student) return fail(res, 'NOT_FOUND', 'Account not found', 404);
  if (!student.force_pw_change) {
    if (!(await bcrypt.compare(current_password || '', student.password_hash)))
      return fail(res, 'BAD_CREDENTIALS', 'Current password incorrect', 401);
  }
  await db('students').where({ id: student.id }).update({ password_hash: await bcrypt.hash(new_password, 12), force_pw_change: 0 });
  await logAudit(student.id, 'auth.student_password_changed', 'student', student.id, null, req.ip);
  res.json({ ok: true, data: { changed: true } });
});

// Student compliance consent
router.post('/student/consent', requireAuth, requireRole('student'), async (req, res) => {
  const { terms_accepted, popia_accepted } = req.body || {};
  if (!terms_accepted || !popia_accepted) return fail(res, 'CONSENT_REQUIRED', 'Both Terms and POPIA consent must be accepted');
  await db('student_consents').insert({
    student_id: req.user.sub,
    terms_accepted: 1, popia_accepted: 1,
    accepted_at: db.fn.now(),
    ip_address: req.ip,
  });
  await logAudit(req.user.sub, 'student.consent_given', 'student', req.user.sub, null, req.ip);
  res.json({ ok: true, data: { consented: true } });
});

router.post('/logout', (req, res) => { res.clearCookie('ls_token'); res.json({ ok: true, data: {} }); });

router.get('/me', requireAuth, async (req, res) => {
  if (req.user.role === 'super_admin') {
    return res.json({ ok: true, data: { role: 'super_admin', name: 'Lecturer', email: process.env.ADMIN_EMAIL } });
  }
  if (req.user.role === 'student') {
    const s = await db('students').where({ id: req.user.sub }).first();
    if (!s) return res.status(401).json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'Account not found' } });
    const consent = await db('student_consents').where({ student_id: s.id }).first();
    const displayName = `${s.surname}, ${s.names}`;
    return res.json({ ok: true, data: {
      role: 'student', name: displayName, surname: s.surname, names: s.names,
      email: s.email, forcePasswordChange: !!s.force_pw_change, hasConsented: !!consent,
    }});
  }
  const u = await db('users').where({ id: req.user.sub }).first();
  if (!u) return res.status(401).json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'Account not found' } });
  res.json({ ok: true, data: { role: u.role, name: u.full_name, email: u.email, forcePasswordChange: !!u.force_pw_change } });
});

export default router;
