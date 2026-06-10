import { Router } from 'express';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import { db, logAudit } from '../config/db.js';
import { issueToken, setAuthCookie, requireAuth } from '../middleware/auth.js';

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

router.post('/logout', (req, res) => { res.clearCookie('ls_token'); res.json({ ok: true, data: {} }); });
router.get('/me', requireAuth, (req, res) => res.json({ ok: true, data: { role: req.user.role, name: req.user.name } }));

export default router;
