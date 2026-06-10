# PROGRESS.md — single source of truth for project state

## Current phase: 1 (Foundation & Auth) — IN PROGRESS

## Phase status
| Phase | Name | Status | Tag |
|---|---|---|---|
| 0 | Foundation files, repo, memory system | ✅ DONE | v1.0-phase0 |
| 1 | Server skeleton, DB migrations (core), admin/staff auth | 🔨 IN PROGRESS | — |
| 2 | Courses, class-list upload, student auth + OTP reset | ⬜ | — |
| 3 | Query system (submit, thread, status, email) | ⬜ | — |
| 4 | Announcements + read receipts | ⬜ | — |
| 5 | Tutor portal (accounts, queries, reports, complaints) | ⬜ | — |
| 6 | Work diary (tasks, meetings, research, consulting, dept, supervision, staff, goals/diary) | ⬜ | — |
| 7 | Lab mgmt + vehicle hire PDF | ⬜ | — |
| 8 | Reports/exports + POPIA cron + backups | ⬜ | — |
| 9 | PWA + security hardening + launch | ⬜ | — |

## Completed in Phase 1 so far
- [x] Express app skeleton with host-based portal routing
- [x] Knex config + initial migration (users, system_config, audit_logs)
- [x] JWT auth service + middleware (requireAuth, requireRole)
- [x] Admin login route + rate limiting
- [x] Staff login + forced password change flow
- [x] Git repo initialised, connected to GitHub (AsadumodwaMcedani/lsport), initial push done
- [x] Local dev environment: MariaDB PATH set, server/.env created, migrations run, npm deps installed
- [x] React admin login page — polished UI (branded card, SVG icons, fade-up animation, show/hide password)
- [x] React admin dashboard shell — dark sidebar with grouped nav + SVG icons, stats cards, welcome banner
- [ ] PM2 + OpenLiteSpeed proxy configured on server
- [ ] First deploy

## Next session: complete Phase 1 — configure PM2 + OpenLiteSpeed on server, do first deploy to work.lbbs.co.za.
