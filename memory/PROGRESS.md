# PROGRESS.md — single source of truth for project state

## Current phase: 2 (Courses + Students) — IN PROGRESS

## Phase status
| Phase | Name | Status | Tag |
|---|---|---|---|
| 0 | Foundation files, repo, memory system | ✅ DONE | v1.0-phase0 |
| 1 | Server skeleton, DB migrations (core), admin/staff auth | ✅ DONE | v1.0-phase1 |
| 2 | Courses, class-list upload, student auth + OTP reset | 🔨 IN PROGRESS | — |
| 3 | Query system (submit, thread, status, email) | ⬜ | — |
| 4 | Announcements + read receipts | ⬜ | — |
| 5 | Tutor portal (accounts, queries, reports, complaints) | ⬜ | — |
| 6 | Work diary (tasks, meetings, research, consulting, dept, supervision, staff, goals/diary) | ⬜ | — |
| 7 | Lab mgmt + vehicle hire PDF | ⬜ | — |
| 8 | Reports/exports + POPIA cron + backups | ⬜ | — |
| 9 | PWA + security hardening + launch | ⬜ | — |

## Phase 1 — completed
- [x] Express app skeleton with host-based portal routing
- [x] Knex config + initial migration (users, system_config, audit_logs)
- [x] JWT auth service + middleware (requireAuth, requireRole)
- [x] Admin login route + rate limiting
- [x] Staff login + forced password change flow
- [x] Git repo initialised, connected to GitHub, initial push
- [x] Local dev environment: MariaDB, server/.env, migrations, npm deps
- [x] React admin login page — polished UI
- [x] React admin dashboard shell — grouped sidebar, stat cards

## Phase 2 — completed so far
- [x] DB migration 002: academic_years, semesters, courses, students, course_enrollments, tutor_assignments
- [x] GET /api/v1/courses/active — public, feeds student login dropdown
- [x] Admin course CRUD (list, create, update)
- [x] Class list upload: parse endpoint (header detection, auto-map, 5-row preview) + import endpoint (creates/updates students, enrolls, bcrypt hashes initial pw)
- [x] Admin students list with course filter + search
- [x] Student login route (student number + course + password, 4h JWT)
- [x] Student forced password change route
- [x] /auth/me updated to return email + forcePasswordChange for all roles
- [x] React admin: Courses page (table + create form + upload modal with column mapper)
- [x] React admin: Students page (list with filter/search)
- [x] Student portal: StudentLogin page (student number + course dropdown + password)
- [x] Student portal: StudentDashboard (with forced-pw-change screen)
- [x] App.jsx surface routing (?portal=student for local dev testing)
- [x] DB migration 003: courses — delivery_type, course_provider; student_consents table
- [x] Migration 004: semesters — add label VARCHAR(5), backfill '1'/'2', supports Y/AA
- [x] Migration 005: students — widen student_number to VARCHAR(30), id_number to VARCHAR(50)
- [x] Import: detailed skip tracking (row, student_number, reason per skipped row)
- [x] Import: only student_number required; surname/names optional (empty string default)
- [x] Import: Update Students mode — matches by student_number, skips non-matching with reason
- [x] Import: auto-generate UFH emails (studentnumber@ufh.ac.za) when email not mapped and course is UFH
- [x] Import: returns { total, created, updated, skipped[], errors[] } — full detail
- [x] Semester options: 1 (S1), 2 (S2), Y (Year Round), AA (Always Available)
- [x] Course list displays semester label (S1/S2/Year/Always)
- [x] Migration 006: password_otps.student_number widened to VARCHAR(30)
- [x] server/src/config/mail.js — Nodemailer transport + sendOtpEmail helper (HTML + text)
- [x] POST /auth/student/reset-request — 6-digit OTP, bcrypt-hashed, stored in password_otps, emailed to {studentnumber}@ufh.ac.za, 10-min expiry, rate-limited 3/15min
- [x] POST /auth/student/reset-verify — validates OTP, resets password, marks OTP used
- [x] StudentLogin.jsx: "Forgot password?" link opens 2-step reset flow (request → verify → done); semester label fix in course dropdown
- [ ] PM2 + OpenLiteSpeed proxy configured on server
- [ ] First deploy

## Next session: Phase 2 is feature-complete. Deploy to production (SSH → PM2 + OLS proxy + run migrations + smoke test).
