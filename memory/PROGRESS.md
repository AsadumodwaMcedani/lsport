# PROGRESS.md — single source of truth for project state

## Current phase: 4 (Announcements) — NOT STARTED

## Phase status
| Phase | Name | Status | Tag |
|---|---|---|---|
| 0 | Foundation files, repo, memory system | ✅ DONE | v1.0-phase0 |
| 1 | Server skeleton, DB migrations (core), admin/staff auth | ✅ DONE | v1.0-phase1 |
| 2 | Courses, class-list upload, student auth + OTP reset | ✅ DONE | — |
| 3 | Query system (submit, thread, status, email) | ✅ DONE | — |
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
- [x] PM2 installed (~/.npm-global), app started, health check confirmed on :3000
- [x] First deploy complete — 2026-06-10
  - Node 18 at /opt/alt/alt-nodejs18/root/usr/bin/node (CloudLinux alt-nodejs)
  - DB: lbbscoza_lsport_dbnm on 127.0.0.1 (not localhost — CloudLinux DNS quirk)
  - All 7 migrations ran; client built; PM2 running
  - OLS mod_proxy disabled on shared hosting; PHP reverse proxy (proxy.php + .htaccess) deployed to both subdomain document roots as workaround
  - portal.lbbs.co.za and work.lbbs.co.za both confirmed live
  - Webway support ticket recommended for proper OLS External App proxy (removes PHP layer)

## Phase 3 — completed
- [x] Migration 007: query_categories (seeded ×4), queries, query_messages, query_status_history, interaction_logs
- [x] GET /queries/categories, GET /queries/stats, GET /queries (admin list + filters/search/pagination)
- [x] GET /queries/:id (admin detail — student info, messages, status history, interaction log)
- [x] POST /queries/:id/messages — public reply or private note, optional file attachment, emails student on public reply
- [x] PATCH /queries/:id/status — status change with notes, logs history, emails student per Appendix A templates
- [x] POST /queries/:id/interactions — log external interaction (channel, direction, summary)
- [x] GET /queries/:id/file, GET /queries/:id/messages/:msgId/file — file download (auth checks)
- [x] POST /queries/student — student submit (with attachment, channel, urgency, pre-filled profile)
- [x] GET /queries/student, GET /queries/student/:id — student list + detail (public messages only)
- [x] mail.js: sendQueryStatusEmail (4 templates per Appendix A), sendQueryReplyEmail
- [x] Admin QueriesPage: filter bar, colour-coded table, query detail panel (thread, reply form, status control, interaction log)
- [x] StudentQueriesPage: list, submit form (all fields), detail with status timeline
- [x] AdminDashboard wired to QueriesPage; Open Queries stat shows live count (clickable)
- [x] StudentDashboard wired to StudentQueriesPage via page state; Submit Query + My Queries buttons active

## Next session: Phase 4 — Announcements (editor, targeting, pin/expiry, student read receipts).

## Deployment — production (2026-06-10)
- Host: zada120.webway.host | User: lbbscoza | DirectAdmin + CloudLinux + OLS
- Node 18: /opt/alt/alt-nodejs18/root/usr/bin/node (add to PATH via .bashrc)
- npm global: ~/.npm-global (npm config set prefix)
- App: ~/lsport | PM2 config: ecosystem.config.cjs | Logs: ~/lsport/logs/
- DB: 127.0.0.1, lbbscoza_lsport_dbnm, lbbscoza_lsport_dbusr
- Uploads: ~/uploads | Backups: ~/backups
- Proxy: PHP passthrough (proxy.php + .htaccess in each subdomain public_html)
- To redeploy: cd ~/lsport && git pull origin main && cd server && npm ci && npx knex migrate:latest && cd ../client && npm run build && cd .. && pm2 reload lsport
