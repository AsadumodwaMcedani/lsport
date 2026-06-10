# SPEC_INDEX.md — read only the section you need from docs/SPEC.md

NOTE: Sections marked [SUPERSEDED] — check memory/DECISIONS.md before relying on them.

| § | Topic | Status |
|---|---|---|
| 1–2 | Summary, architecture diagram | Valid (single DB now) |
| 3 | Tech stack table | [SUPERSEDED partly] — no Redis, no Puppeteer, MariaDB |
| 4 | Hosting/env vars | [SUPERSEDED] — DirectAdmin, single DB env vars in server/.env.example |
| 5 | Domains & URL maps | Valid, but admin.lbbs.co.za → work.lbbs.co.za |
| 6 | Branding, palette, typography, badges | Valid — authoritative for all UI |
| 7 | Roles & permission matrix | Valid (ignore WhatsApp/AI rows for v1) |
| 8 | Auth flows | [SUPERSEDED] — see CLAUDE.md Auth rules |
| 9 | DB schemas (5 DBs) | Valid table designs; merge into ONE db `lbbs_prod` |
| 10 | Core entities list | Valid |
| 11 | Entity Builder | NOT IN V1 — docs/future only |
| 12 | Admin portal features | Valid (skip 12.7 WhatsApp bits, AI buttons) |
| 13 | Student portal | Valid |
| 14 | Tutor portal | Valid |
| 15 | AI integration | NOT IN V1 — docs/future only |
| 16 | Notifications | Email valid; WhatsApp NOT IN V1 |
| 17 | Reports | Valid, PDFKit not Puppeteer |
| 18 | Vehicle hire PDF | Valid, PDFKit |
| 19 | PWA | Valid |
| 20 | Security | Valid minus TOTP |
| 21 | POPIA | Valid, single DB |
| 22 | Backups | Superseded by nightly script scripts/backup.sh |
| 23 | Build phases | Superseded by memory/ROADMAP.md |
| App A | Email templates | Valid — use verbatim |
| App B | Config defaults | Valid (year now 2026) |
