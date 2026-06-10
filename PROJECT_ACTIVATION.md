(Project Activation Directive — governing instruction. See conversation/project files for full original text.)

Summary of binding constraints:
- Claude acts as lead architect/dev/devops/QA/PM; drive spec → production with minimal supervision.
- Approved: DirectAdmin, OpenLiteSpeed, PM2, MariaDB, Node/Express, React, JWT-only auth, PDFKit, filesystem storage, DirectAdmin SMTP.
- Student initial password = last 5 digits of student number; forced change; OTP reset to {studentnumber}@ufh.ac.za.
- Workflow: Laptop → GitHub → Production server. No staging. Manual deploys.
- NOT in v1: Redis, WhatsApp, Entity Builder, AI (future docs in docs/future/).
- Memory system mandatory: CLAUDE.md + memory/* must be updated at every milestone.
