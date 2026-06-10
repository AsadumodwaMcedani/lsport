# CLAUDE.md — LS Port Project Memory (READ FIRST, EVERY SESSION)

## What this project is
LBBS Student Portal (LS Port): private work-management + student query portal for a UFH lecturer.
Full spec: `docs/SPEC.md`. Governing directive: `PROJECT_ACTIVATION.md`.
Current state: `memory/PROGRESS.md`. Decisions: `memory/DECISIONS.md`. Open issues: `memory/ISSUES.md`.

## Session protocol (mandatory)
1. Read this file, then `memory/PROGRESS.md` and `memory/ISSUES.md`.
2. Work on ONE feature/task per session.
3. Before ending: run tests, update `memory/PROGRESS.md`, log new decisions in `memory/DECISIONS.md`, commit + push.
4. Never read `docs/SPEC.md` in full unless needed — read only the section for the current task (it is large). Section index is in `docs/SPEC_INDEX.md`.

## Approved architecture (FINAL — do not redesign)
- Server: DirectAdmin host, OpenLiteSpeed reverse proxy → Node.js (PM2) on :3000
- Domains: portal.lbbs.co.za (students + /tutor), work.lbbs.co.za (admin panel)
- ONE database: MariaDB 10.6, name `lbbs_prod` (NOT five databases — superseded spec §9)
- Backend: Node.js 18+, Express.js, Knex.js (mysql2 driver)
- Frontend: React (Vite), Tailwind CSS, Chart.js. One SPA per portal surface, single repo.
- Auth: JWT in httpOnly cookies ONLY. No TOTP/2FA in v1 (superseded spec §8.1). bcrypt hashes.
- Email: Nodemailer via DirectAdmin SMTP (mail.lbbs.co.za)
- PDF: PDFKit (NOT Puppeteer — superseded spec §17/§18)
- Files: filesystem storage under UPLOAD_PATH
- EXCLUDED from v1: Redis, WhatsApp integration, Entity Builder, AI features (docs in docs/future/)

## Auth rules (supersedes spec §8)
- Admin (work.lbbs.co.za): email + password (bcrypt, .env hash), JWT 8h, rate-limit 5/15min
- Staff: student number + one-time password, forced change on first login, JWT 8h
- Student (portal): student number + course dropdown + password. INITIAL PASSWORD = LAST 5 DIGITS OF STUDENT NUMBER. Forced change on first login. JWT 4h.
- Student password reset: 6-digit OTP emailed to `{studentnumber}@ufh.ac.za`, 10-min expiry, then set new password.
- Tutor: student number + assigned password, forced change on first login, JWT 8h.

## Conventions
- JS: ES modules, async/await, no callbacks. 2-space indent. Single quotes.
- API: REST under `/api/v1/`. JSON `{ ok, data | error }` envelope. Errors: `{ ok:false, error:{ code, message } }`.
- DB: snake_case tables/columns. Every table: `id`, `created_at`. Migrations only — never raw schema edits.
- All queries via Knex parameter binding. Never string-concatenate SQL.
- Roles enforced server-side via `requireRole()` middleware on every route. Students may only access rows where `student_id` = JWT subject.
- Frontend design tokens: see `client/src/lib/tokens.css` (palette from spec §6: #1F2937 / #FFF8F0 / #FA7921 / #7D4600 / #FFE66D; Poppins headings, Open Sans body).
- Commits: `phaseN: short description`. Tag at phase completion: `v1.0-phaseN`.

## Git strategy
- Branches: `main` (production) + `dev` (work). Merge dev→main only when phase tested.
- GitHub = source of truth. Push at end of every session.

## Deployment (production only, manual)
- See `docs/deployment/DEPLOY.md`. Summary: SSH → `cd ~/lsport && ./scripts/deploy.sh`
- Rollback: `./scripts/rollback.sh <tag>`

## Phase order (see memory/ROADMAP.md for detail)
1 Foundation+Auth → 2 Courses+Students → 3 Queries → 4 Announcements → 5 Tutors → 6 Work Diary → 7 Lab+Vehicles → 8 Reports+POPIA → 9 PWA+Hardening
(Entity Builder and AI = NOT in v1; future docs only.)
