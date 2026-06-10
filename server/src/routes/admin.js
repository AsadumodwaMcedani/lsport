import { Router } from 'express';
import { db, logAudit } from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const fail = (res, code, msg, status = 400) => res.status(status).json({ ok: false, error: { code, message: msg } });

const PROFILE_KEYS = ['admin.full_name', 'admin.surname', 'admin.whatsapp', 'admin.official_email', 'admin.personal_email'];

router.get('/profile', requireAuth, requireRole('super_admin'), async (_req, res, next) => {
  try {
    const rows = await db('system_config').whereIn('config_key', PROFILE_KEYS);
    const profile = {};
    for (const r of rows) profile[r.config_key.replace('admin.', '')] = r.config_value;
    res.json({ ok: true, data: profile });
  } catch (err) { next(err); }
});

router.post('/profile', requireAuth, requireRole('super_admin'), async (req, res, next) => {
  try {
    const { full_name, surname, whatsapp, official_email, personal_email } = req.body || {};
    const updates = { full_name, surname, whatsapp, official_email, personal_email };
    for (const [k, v] of Object.entries(updates)) {
      if (v === undefined) continue;
      await db('system_config')
        .insert({ config_key: `admin.${k}`, config_value: v, updated_at: db.fn.now() })
        .onConflict('config_key').merge({ config_value: v, updated_at: db.fn.now() });
    }
    await logAudit(req.user.sub, 'admin.profile_updated', null, null, null);
    res.json({ ok: true, data: { saved: true } });
  } catch (err) { next(err); }
});

export default router;
