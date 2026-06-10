import { Router } from 'express';
import multer from 'multer';
import ExcelJS from 'exceljs';
import bcrypt from 'bcrypt';
import path from 'node:path';
import fs from 'node:fs/promises';
import { db, logAudit } from '../config/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
const fail = (res, code, msg, status = 400) => res.status(status).json({ ok: false, error: { code, message: msg } });

const upload = multer({
  dest: path.join(process.env.UPLOAD_PATH || 'uploads', 'tmp'),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.originalname.endsWith('.xlsx') || file.originalname.endsWith('.xls');
    cb(ok ? null : new Error('Only .xlsx / .xls files allowed'), ok);
  }
});

// ── Academic year + semester helpers ──────────────────────────────────────────

async function ensureYearSemester(year, semesterNumber) {
  let ay = await db('academic_years').where({ year }).first();
  if (!ay) [ay] = await db('academic_years').insert({ year, is_active: true }).returning ? []
    : [{ id: (await db('academic_years').insert({ year, is_active: true }))[0] }];
  if (!ay?.id) ay = await db('academic_years').where({ year }).first();

  let sem = await db('semesters').where({ academic_year_id: ay.id, semester_number: semesterNumber }).first();
  if (!sem) {
    await db('semesters').insert({ academic_year_id: ay.id, semester_number: semesterNumber, is_active: true });
    sem = await db('semesters').where({ academic_year_id: ay.id, semester_number: semesterNumber }).first();
  }
  return { academicYear: ay, semester: sem };
}

// ── Public: active courses (for student login dropdown) ──────────────────────

router.get('/active', async (_req, res) => {
  const courses = await db('courses as c')
    .join('semesters as s', 's.id', 'c.semester_id')
    .join('academic_years as ay', 'ay.id', 's.academic_year_id')
    .where('c.is_active', true)
    .orderBy([{ column: 'ay.year', order: 'desc' }, { column: 's.semester_number' }, { column: 'c.code' }])
    .select('c.id', 'c.code', 'c.name', 'ay.year', 's.semester_number');
  res.json({ ok: true, data: courses });
});

// ── Admin: list courses ───────────────────────────────────────────────────────

router.get('/', requireAuth, requireRole('super_admin'), async (_req, res) => {
  const courses = await db('courses as c')
    .join('semesters as s', 's.id', 'c.semester_id')
    .join('academic_years as ay', 'ay.id', 's.academic_year_id')
    .orderBy([{ column: 'ay.year', order: 'desc' }, { column: 's.semester_number' }, { column: 'c.code' }])
    .select('c.*', 'ay.year', 's.semester_number',
      db.raw('(SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id) as enrolled_count'));
  res.json({ ok: true, data: courses });
});

// ── Admin: create course ──────────────────────────────────────────────────────

router.post('/', requireAuth, requireRole('super_admin'), async (req, res) => {
  const { code, name, year, semester_number, description } = req.body || {};
  if (!code || !name || !year || !semester_number) return fail(res, 'MISSING_FIELDS', 'code, name, year and semester_number required');
  const { semester } = await ensureYearSemester(parseInt(year), parseInt(semester_number));
  const existing = await db('courses').where({ code, semester_id: semester.id }).first();
  if (existing) return fail(res, 'DUPLICATE', `Course ${code} already exists in this semester`);
  const [id] = await db('courses').insert({ code: code.toUpperCase(), name, semester_id: semester.id, description: description || null });
  await logAudit(req.user.sub, 'course.created', 'course', id, { code, name });
  res.status(201).json({ ok: true, data: { id } });
});

// ── Admin: update course ──────────────────────────────────────────────────────

router.patch('/:id', requireAuth, requireRole('super_admin'), async (req, res) => {
  const { name, description, is_active } = req.body || {};
  const course = await db('courses').where({ id: req.params.id }).first();
  if (!course) return fail(res, 'NOT_FOUND', 'Course not found', 404);
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (is_active !== undefined) updates.is_active = is_active ? 1 : 0;
  await db('courses').where({ id: course.id }).update(updates);
  res.json({ ok: true, data: { updated: true } });
});

// ── Admin: parse class list (step 1 — detect columns) ────────────────────────

router.post('/:id/upload/parse', requireAuth, requireRole('super_admin'), upload.single('file'), async (req, res) => {
  if (!req.file) return fail(res, 'NO_FILE', 'No file uploaded');
  try {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(req.file.path);
    const ws = wb.worksheets[0];
    if (!ws) { await fs.unlink(req.file.path).catch(() => {}); return fail(res, 'EMPTY_FILE', 'Workbook has no sheets'); }

    const headers = [];
    ws.getRow(1).eachCell({ includeEmpty: true }, (cell) => headers.push(String(cell.value ?? '')));

    const preview = [];
    for (let r = 2; r <= Math.min(ws.rowCount, 6); r++) {
      const row = [];
      ws.getRow(r).eachCell({ includeEmpty: true }, (cell) => row.push(String(cell.value ?? '')));
      if (row.some(v => v)) preview.push(row);
    }

    const suggested = autoMap(headers);
    res.json({ ok: true, data: { tmpPath: req.file.path, headers, preview, suggested } });
  } catch (e) {
    await fs.unlink(req.file.path).catch(() => {});
    fail(res, 'PARSE_ERROR', `Could not parse file: ${e.message}`);
  }
});

// ── Admin: import class list (step 2 — apply mapping) ────────────────────────

router.post('/:id/upload/import', requireAuth, requireRole('super_admin'), upload.single('file'), async (req, res) => {
  const courseId = parseInt(req.params.id);
  const course = await db('courses').where({ id: courseId }).first();
  if (!course) { if (req.file) await fs.unlink(req.file.path).catch(() => {}); return fail(res, 'NOT_FOUND', 'Course not found', 404); }

  let mapping;
  try { mapping = JSON.parse(req.body.column_map || '{}'); } catch { return fail(res, 'BAD_MAPPING', 'column_map must be valid JSON'); }

  const filePath = req.file?.path || req.body.tmp_path;
  if (!filePath) return fail(res, 'NO_FILE', 'No file provided');

  try {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(filePath);
    const ws = wb.worksheets[0];

    const get = (row, field) => {
      const idx = mapping[field];
      if (idx === undefined || idx === null) return '';
      return String(row.getCell(idx + 1).value ?? '').trim();
    };

    let created = 0, updated = 0, errors = [];

    for (let r = 2; r <= ws.rowCount; r++) {
      const row = ws.getRow(r);
      const studentNumber = get(row, 'student_number');
      const surname = get(row, 'surname');
      const names = get(row, 'names');
      if (!studentNumber || !surname || !names) continue;

      try {
        const initialPw = studentNumber.slice(-5);
        const hash = await bcrypt.hash(initialPw, 10);
        const expiresAt = new Date(); expiresAt.setMonth(expiresAt.getMonth() + 13);

        const existing = await db('students').where({ student_number: studentNumber }).first();
        let studentId;
        if (existing) {
          await db('students').where({ id: existing.id }).update({
            surname, names,
            id_number:     get(row, 'id_number')    || existing.id_number,
            email:         get(row, 'email')         || existing.email,
            phone:         get(row, 'phone')         || existing.phone,
            course_name:   get(row, 'course_name')   || existing.course_name,
            qualification: get(row, 'qualification') || existing.qualification,
          });
          studentId = existing.id;
          updated++;
        } else {
          [studentId] = await db('students').insert({
            student_number: studentNumber, surname, names,
            id_number:     get(row, 'id_number')    || null,
            email:         get(row, 'email')         || null,
            phone:         get(row, 'phone')         || null,
            course_name:   get(row, 'course_name')   || null,
            qualification: get(row, 'qualification') || null,
            password_hash: hash,
            force_pw_change: 1,
            data_expires_at: expiresAt.toISOString().split('T')[0],
          });
          created++;
        }
        await db('course_enrollments').insert({ student_id: studentId, course_id: courseId }).onConflict(['student_id', 'course_id']).ignore();
      } catch (rowErr) {
        errors.push({ row: r, student_number: studentNumber, error: rowErr.message });
      }
    }

    if (req.file) await fs.unlink(filePath).catch(() => {});
    await logAudit(req.user.sub, 'students.imported', 'course', courseId, { created, updated, errors: errors.length });
    res.json({ ok: true, data: { created, updated, errors } });
  } catch (e) {
    if (req.file) await fs.unlink(filePath).catch(() => {});
    fail(res, 'IMPORT_ERROR', `Import failed: ${e.message}`);
  }
});

// ── helpers ───────────────────────────────────────────────────────────────────

function autoMap(headers) {
  const patterns = {
    surname:       /sur.?name|last.?name|family/i,
    names:         /^(first.?)?names?$|given|forename/i,
    student_number:/student.?no|student.?num|stud.?no|s\.?no/i,
    id_number:     /id.?no|id.?num|identity|id.?number/i,
    email:         /e.?mail/i,
    phone:         /phone|cell|mobile|contact.?no/i,
    course_name:   /course.?name|module.?name/i,
    qualification: /qualif|program|degree/i,
  };
  const map = {};
  headers.forEach((h, i) => {
    for (const [field, re] of Object.entries(patterns)) {
      if (re.test(h) && map[field] === undefined) { map[field] = i; break; }
    }
  });
  return map;
}

export default router;
