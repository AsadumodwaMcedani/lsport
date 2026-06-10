import { Router } from 'express';
import { db } from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, requireRole('super_admin'), async (req, res) => {
  const { course_id, search } = req.query;

  let q = db('students as st')
    .select(
      'st.id', 'st.student_number', 'st.surname', 'st.names',
      'st.email', 'st.phone', 'st.is_active',
      db.raw('(SELECT COUNT(*) FROM course_enrollments ce WHERE ce.student_id = st.id) as course_count')
    )
    .where('st.is_active', 1)
    .orderBy([{ column: 'st.surname' }, { column: 'st.names' }]);

  if (course_id) {
    q = q.whereExists(function () {
      this.select('*').from('course_enrollments as ce').whereRaw('ce.student_id = st.id').where('ce.course_id', course_id);
    });
  }
  if (search) {
    const like = `%${search}%`;
    q = q.where(function () {
      this.where('st.student_number', 'like', like)
          .orWhere('st.surname', 'like', like)
          .orWhere('st.names', 'like', like);
    });
  }

  const rows = await q.limit(500);
  res.json({ ok: true, data: rows });
});

export default router;
