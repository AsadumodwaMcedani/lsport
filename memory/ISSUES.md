# ISSUES.md — unresolved issues & assumptions (review at every session start)

## Open issues
- I-001: DirectAdmin SMTP credentials not yet confirmed (host/port/user). BLOCKS Phase 2 OTP email. Owner to provide.
- I-002: OpenLiteSpeed reverse-proxy config for both subdomains not yet applied on server. BLOCKS first deploy.
- I-003: Logo not yet provided — using "LS PORT" text logo per spec §6 until then.
- I-004: Confirm GitHub repo created and remote added (`git remote -v`).
- I-005: Verify Node 18+ available on server (`node -v` over SSH); install via nvm if absent.

## Assumptions (validate when convenient)
- A-001: Student numbers are ≥5 digits, numeric tail (initial-password rule depends on this).
- A-002: All students have a working {studentnumber}@ufh.ac.za mailbox.
- A-003: MariaDB user with full rights on `lbbs_prod` can be created via DirectAdmin.
- A-004: Class lists arrive as .xlsx with header row (spec §12.2).
- A-005: student_number values may be longer than 20 chars (widened to 30 in migration 005; flag if 30 is still too short).

## Resolved
- I-004: ✅ 2026-06-10 — GitHub repo created (AsadumodwaMcedani/lsport) and initial push completed.
- I-005: ✅ 2026-06-10 — Node 18+ confirmed on local machine (v24.16.0). Server-side still to verify over SSH.
