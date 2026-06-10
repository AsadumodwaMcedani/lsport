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
- [ ] PM2 + OpenLiteSpeed proxy configured on server
- [ ] First deploy

## Next session: test Phase 2 end-to-end (create course → upload class list → student logs in), then deploy Phase 1+2 to server.
