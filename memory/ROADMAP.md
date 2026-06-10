# ROADMAP.md — phase breakdown, implementation order, milestones

Format per phase: Prerequisites → Deliverables → Tests → Docs → Deploy → Exit criteria.
Estimated total: 8–13 weeks part-time. Soft launch to one module after Phase 4.

## Phase 0 — Foundation (DONE)
Repo, memory system, automation, docs structure, deployment scripts, future-feature docs.

## Phase 1 — Server skeleton & auth  (~1 week)
- Prereq: GitHub repo, local Node 18+, local MariaDB.
- Deliver: Express app + host routing; migrations 001 (users, system_config, audit_logs); auth service (bcrypt, JWT httpOnly cookies); admin + staff login; rate limiting; React shell with login + dashboard layout for work.lbbs.co.za; PM2 ecosystem file; OpenLiteSpeed proxy configured; first production deploy.
- Tests: supertest — admin login success/fail/rate-limit; requireRole blocks wrong roles; JWT expiry.
- Exit: Admin logs into work.lbbs.co.za over HTTPS. Tag v1.0-phase1.

## Phase 2 — Courses & students  (~1.5 weeks)
- Deliver: academic_years/semesters/courses CRUD; class-list .xlsx upload + column mapper + preview + import (Multer + ExcelJS); students table; enrollments; student login (number + course + password, initial = last 5 of student number, forced change); OTP password reset via email; student dashboard empty state.
- Tests: import dedup (existing student number updates); login matrix; OTP expiry/reuse; student cannot hit admin API.
- Exit: real class list imported; student logs in and changes password. Tag v1.0-phase2.

## Phase 3 — Query system  (~2 weeks) ← core product
- Deliver: query submit (all fields + attachment); admin list/filters/badges; detail + threaded messages (public/private); status workflow + history; email on status change & public reply (templates per spec Appendix A); interaction log (channels: whatsapp/email/blackboard/f2f/system — manual logging only, no WhatsApp integration); student query views + status timeline.
- Tests: full lifecycle; private notes invisible to student API; closed query not re-openable; attachment whitelist+10MB.
- Exit: end-to-end lifecycle on production with test student. Tag v1.0-phase3.

## Phase 4 — Announcements  (~0.5 week)
- Deliver: editor (course/student/all targeting, pin, expiry); student popup + "I have read" receipt; admin read-receipt view + CSV.
- Exit: receipt visible to admin. Tag v1.0-phase4. → SOFT LAUNCH one module.

## Phase 5 — Tutor portal  (~1.5 weeks)
- Deliver: tutor accounts + course assignment; /tutor login (forced change); tutor dashboard; module-scoped query replies (public only, no status change); student list (names+numbers only); session reports → admin inbox; student complaint form; admin-only complaint inbox.
- Tests: tutor cannot see other modules / ID numbers / complaints; complaint privacy.
- Exit: tag v1.0-phase5.

## Phase 6 — Work diary  (~2 weeks)
- Deliver: tasks (entity-linked, priorities, board), meetings (+attendees, minutes, PDF export), research (+collaborators, milestones), consulting, departmental duties (+meetings), supervision (+meetings, milestones, progress PDF), staff directory (+interactions), goals + diary.
- Pattern: build Tasks fully first; replicate the established list/detail/form pattern.
- Exit: tag v1.0-phase6.

## Phase 7 — Lab & vehicles  (~1 week)
- Deliver: equipment register, bookings (calendar+list, approve/reject), incidents; vehicle hire form (pre-fill from last record, dates, auto duration, canvas signature) → PDFKit A4 output → saved + downloadable.
- Exit: PDF matches spec §18 format. Tag v1.0-phase7.

## Phase 8 — Reports, POPIA, backups  (~1 week)
- Deliver: all spec §12.9 reports (PDFKit + ExcelJS); custom export builder; POPIA daily anonymisation cron (13 months, spec §21, adapted to single DB); nightly backup script + offsite rclone; manual backup download in settings.
- Tests: POPIA job dry-run mode first; verify anonymisation leaves aggregates intact.
- Exit: tag v1.0-phase8.

## Phase 9 — PWA & hardening  (~1 week)
- Deliver: manifests (LS Admin / LS Port), service worker (Workbox), offline page, install prompt; Helmet, CORS lockdown, input validation sweep, audit-log viewer; load check; final security review checklist (docs/architecture/SECURITY_CHECKLIST.md).
- Exit: v1.0 FULL LAUNCH. Tag v1.0.

## Post-v1 (documented only): Entity Builder (docs/future/ENTITY_BUILDER.md), AI (docs/future/AI_FEATURES.md), WhatsApp trigger.
