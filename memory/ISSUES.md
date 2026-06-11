# ISSUES.md — unresolved issues & assumptions (review at every session start)

## Open issues
- I-001: SMTP credentials confirmed (mail.lbbs.co.za:587, noreply@lbbs.co.za). Email delivery not yet smoke-tested in production — verify OTP email reaches a UFH mailbox.
- I-003: Logo not yet provided — using "LS PORT" text logo per spec §6 until then.
- I-006: OLS reverse proxy still using PHP passthrough workaround. Raise Webway support ticket to configure OLS External App → proxy to 127.0.0.1:3000 for both subdomains, then remove proxy.php + .htaccess from document roots.

## Assumptions (validate when convenient)
- A-001: Student numbers are ≥5 digits, numeric tail (initial-password rule depends on this).
- A-002: All students have a working {studentnumber}@ufh.ac.za mailbox.
- A-003: MariaDB user with full rights on `lbbs_prod` can be created via DirectAdmin.
- A-004: Class lists arrive as .xlsx with header row (spec §12.2).
- A-005: student_number values may be longer than 20 chars (widened to 30 in migration 005; flag if 30 is still too short).

## Resolved
- I-004: ✅ 2026-06-10 — GitHub repo created (AsadumodwaMcedani/lsport) and initial push completed.
- I-005: ✅ 2026-06-10 — Node 18 confirmed on production server (v18.20.8) via CloudLinux alt-nodejs18.
- I-002: ✅ 2026-06-10 — Worked around with PHP reverse proxy; both subdomains live.
