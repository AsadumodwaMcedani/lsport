# DECISIONS.md — Architectural Decision Record (append-only)

| # | Date | Decision | Reason | Supersedes |
|---|---|---|---|---|
| 1 | 2026-06-10 | One MariaDB database `lbbs_prod` instead of five | Cross-DB FKs impossible; simpler backup/config; single-server | Spec §9 |
| 2 | 2026-06-10 | No Redis | JWT is stateless; no measured caching need | Spec §3 |
| 3 | 2026-06-10 | PDFKit instead of Puppeteer | Server load avg 3.5–4.4; headless Chrome too heavy; PDFs are simple | Spec §3, §17, §18 |
| 4 | 2026-06-10 | JWT-only auth, no TOTP/2FA in v1 | Owner directive; strong admin password + rate limiting retained | Spec §8.1 |
| 5 | 2026-06-10 | Student initial password = last 5 digits of STUDENT NUMBER, forced change on first login | Owner directive; avoids storing/deriving from SA ID (POPIA win) | Spec §8.3 |
| 6 | 2026-06-10 | Student password reset = OTP to {studentnumber}@ufh.ac.za | Owner directive; self-service, no admin bottleneck | Spec §8.3 |
| 7 | 2026-06-10 | work.lbbs.co.za = admin panel; portal.lbbs.co.za = students+tutors | Matches available subdomains | Spec §5 (admin.lbbs.co.za) |
| 8 | 2026-06-10 | Entity Builder, AI, WhatsApp excluded from v1; documented in docs/future/ | Owner directive; risk/scope control | Spec §11, §15, §16 |
| 9 | 2026-06-10 | No staging env; production-only manual deploy via deploy.sh, tags for rollback | Owner directive; mitigated by local testing + tagged releases | Prior recommendation |
| 10 | 2026-06-10 | Single Express process serves both subdomains via Host-header routing; single Vite build with three entry surfaces (admin/student/tutor) routed client-side by hostname | Spec §2; one PM2 process to manage | — |
| 11 | 2026-06-10 | Sensitive data deletion (POPIA) at 13 months via daily node-cron inside the app process (02:00 SAST), not system cron | Fewer moving parts; logged to audit_logs | — |
| 12 | 2026-06-10 | Local dev uses MariaDB root user directly (no separate lbbs_user on dev machine) | Simpler local setup; lbbs_user still required on production server | — |
| 13 | 2026-06-10 | Admin email for local dev set to mcedanila@gmail.com | Owner's personal email; production will use lecturer@ufh.ac.za | — |
