# LBBS Student Portal (LS Port)
## Complete System Specification Document
**Version 1.0 | Prepared for Development**
**Owner:** Lecturer, University of Fort Hare (UFH)
**Domain:** lbbs.co.za

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Infrastructure & Hosting](#4-infrastructure--hosting)
5. [Domain & URL Structure](#5-domain--url-structure)
6. [Branding & Design System](#6-branding--design-system)
7. [User Roles & Permissions](#7-user-roles--permissions)
8. [Authentication Flows](#8-authentication-flows)
9. [Database Architecture](#9-database-architecture)
10. [Core Entity Definitions](#10-core-entity-definitions)
11. [Dynamic Entity Builder](#11-dynamic-entity-builder)
12. [Admin Portal — admin.lbbs.co.za](#12-admin-portal--adminlbbscoza)
13. [Student Portal — portal.lbbs.co.za](#13-student-portal--portallbbscoza)
14. [Tutor Portal — portal.lbbs.co.za/tutor](#14-tutor-portal--portallbbscozatutor)
15. [AI Integration — Google Gemini](#15-ai-integration--google-gemini)
16. [Notification System](#16-notification-system)
17. [Reporting & Exports](#17-reporting--exports)
18. [PDF Generator — Vehicle Hire Form](#18-pdf-generator--vehicle-hire-form)
19. [PWA Configuration](#19-pwa-configuration)
20. [Security Implementation](#20-security-implementation)
21. [POPIA & Data Retention](#21-popia--data-retention)
22. [Backup Strategy](#22-backup-strategy)
23. [Build Phases & Roadmap](#23-build-phases--roadmap)

---

## 1. Executive Summary

**LS Port** is a private work management system and student-facing query portal built for a University of Fort Hare lecturer. It serves as a central operational hub — logging all work activity, managing student queries, coordinating tutors, overseeing lab operations, and handling administrative tasks across all professional domains.

### Core Principles

- **Coded Once, Runs Forever** — No feature should ever require code changes. All structural changes are made through the admin UI (Entity Builder, field management, status flows, dropdown options).
- **Two Distinct Sides** — A fully private admin panel accessible only to the lecturer and their authorized staff, and a public-facing portal accessible to students and tutors.
- **Full Work Diary** — Every professional interaction, communication, task, and event is logged against the relevant entity (student, module, project, committee, etc.).
- **Expandable Without Recoding** — New entity types, fields, and workflows are created through a visual admin interface.
- **Available Everywhere** — Installed as a Progressive Web App (PWA) on any device.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          INTERNET                               │
└────────────┬────────────────────────┬───────────────────────────┘
             │                        │
    admin.lbbs.co.za         portal.lbbs.co.za
             │                        │
┌────────────▼────────────────────────▼───────────────────────────┐
│              Node.js (Express.js) Application                   │
│                     Single Codebase                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Admin Router │  │ Student      │  │ Tutor Router         │  │
│  │ /admin/*     │  │ Router /s/*  │  │ /tutor/*             │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │           Shared Services Layer                             ││
│  │  Auth | Entity Engine | AI | PDF | Email | Reports | POPIA  ││
│  └─────────────────────────────────────────────────────────────┘│
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │         MySQL               │
        │  lbbs_core  lbbs_academic   │
        │  lbbs_work  lbbs_lab        │
        │  lbbs_vehicles              │
        └─────────────────────────────┘
```

### Architecture Decisions

- **Single Node.js app** serves all three portals — distinguished by subdomain/path routing.
- **React.js frontend** (Vite build) served as a Single Page Application (SPA) per portal.
- **REST API** backend with JWT authentication.
- **Five MySQL databases** for clean separation of concerns.
- **External AI** calls to Google Gemini 1.5 Flash API (no GPU required).
- **Nodemailer** for email via UFH SMTP.

---

## 3. Technology Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | React.js (Vite) | Component-based, fast, PWA-ready |
| Styling | Tailwind CSS | Rapid styling with design token support |
| Charts | Chart.js | Dashboard visualisations |
| Backend | Node.js + Express.js | cPanel-supported, efficient |
| Database | MySQL 8.x | Available on cPanel, robust |
| ORM | Knex.js | SQL query builder, migration support |
| Auth | JWT + bcrypt | Stateless authentication |
| 2FA | speakeasy + qrcode | Google Authenticator TOTP |
| Email | Nodemailer | UFH SMTP integration |
| PDF | Puppeteer or pdfkit | Report + vehicle form generation |
| Excel | ExcelJS | .xlsx report generation |
| File Upload | Multer | Class list, attachments |
| AI | Google Gemini 1.5 Flash | Free tier, contextual suggestions |
| PWA | Workbox (Vite plugin) | Service worker, install prompt |
| Scheduler | node-cron | Automated backups, POPIA deletion |
| Session Store | Redis (cPanel-provided) | Fast session/token caching |

---

## 4. Infrastructure & Hosting

### Hosting Platform
- **Provider:** Current cPanel host (lbbs.co.za)
- **Node.js:** Set up via cPanel → "Setup Node.js App"
- **MySQL:** Multiple databases via phpMyAdmin
- **Redis:** Available via cPanel (session caching)
- **SSL:** Free SSL Certificates via cPanel for each subdomain
- **Cron Jobs:** cPanel Cron Job manager for automated tasks
- **File Storage:** `/public_html/uploads/` for file attachments (images, documents)

### Node.js App Setup (cPanel)
```
Application Root:  /home/lbbscoza/lsport
Application URL:   lbbs.co.za
Startup File:      server.js
Node Version:      18.x LTS or higher
Environment:       Production
```

### Environment Variables (`.env`)
```
NODE_ENV=production
PORT=3000

# Databases
DB_CORE_HOST=localhost
DB_CORE_USER=lbbscoza_core
DB_CORE_PASS=<strong_password>
DB_CORE_NAME=lbbscoza_core

DB_ACADEMIC_HOST=localhost
DB_ACADEMIC_USER=lbbscoza_academic
DB_ACADEMIC_PASS=<strong_password>
DB_ACADEMIC_NAME=lbbscoza_academic

DB_WORK_HOST=localhost
DB_WORK_USER=lbbscoza_work
DB_WORK_PASS=<strong_password>
DB_WORK_NAME=lbbscoza_work

DB_LAB_HOST=localhost
DB_LAB_USER=lbbscoza_lab
DB_LAB_PASS=<strong_password>
DB_LAB_NAME=lbbscoza_lab

DB_VEHICLES_HOST=localhost
DB_VEHICLES_USER=lbbscoza_vehicles
DB_VEHICLES_PASS=<strong_password>
DB_VEHICLES_NAME=lbbscoza_vehicles

# Auth
JWT_SECRET=<64_char_random_string>
JWT_EXPIRES_IN=8h
ADMIN_EMAIL=<lecturer_ufh_email>
ADMIN_PASSWORD_HASH=<bcrypt_hash>

# Email (UFH SMTP)
SMTP_HOST=<ufh_smtp_server>
SMTP_PORT=587
SMTP_USER=<ufh_email_address>
SMTP_PASS=<ufh_email_password>
SMTP_FROM=<ufh_email_address>

# AI
GEMINI_API_KEY=<google_gemini_api_key>

# Redis
REDIS_URL=redis://localhost:6379

# App
ADMIN_DOMAIN=admin.lbbs.co.za
PORTAL_DOMAIN=portal.lbbs.co.za
UPLOAD_PATH=/home/lbbscoza/uploads
BACKUP_PATH=/home/lbbscoza/backups
```

---

## 5. Domain & URL Structure

### Subdomains

| Subdomain | Audience | Purpose |
|-----------|----------|---------|
| `admin.lbbs.co.za` | Lecturer + Staff | Private admin panel |
| `portal.lbbs.co.za` | Students | Student query portal |
| `portal.lbbs.co.za/tutor` | Tutors | Tutor operational portal |

### cPanel Subdomain Setup
1. cPanel → **Subdomain Management** → Create `admin` and `portal`
2. Point both to the same Node.js app document root
3. Apply SSL via cPanel → **SSL Certificates** for each subdomain
4. The Express.js server reads the `Host` header to route accordingly:
   ```javascript
   app.use((req, res, next) => {
     req.portalType = req.hostname.startsWith('admin') ? 'admin' : 'public';
     next();
   });
   ```

### URL Map — Admin
```
admin.lbbs.co.za/                    → Dashboard
admin.lbbs.co.za/login               → Login (password + TOTP)
admin.lbbs.co.za/queries             → All queries
admin.lbbs.co.za/queries/:id         → Query detail + response
admin.lbbs.co.za/students            → Student list
admin.lbbs.co.za/students/:id        → Student profile + interaction log
admin.lbbs.co.za/courses             → Course/module list
admin.lbbs.co.za/courses/:id         → Course detail + enrolled students
admin.lbbs.co.za/announcements       → Announcements manager
admin.lbbs.co.za/tasks               → Task/to-do manager
admin.lbbs.co.za/meetings            → Meetings log
admin.lbbs.co.za/research            → Research projects
admin.lbbs.co.za/consulting          → Consulting engagements
admin.lbbs.co.za/departmental        → Departmental duties
admin.lbbs.co.za/supervision         → Staff/student supervision
admin.lbbs.co.za/lab                 → Lab management
admin.lbbs.co.za/vehicles            → Vehicle hire records
admin.lbbs.co.za/tutors              → Tutor management
admin.lbbs.co.za/staff               → Colleagues/staff log
admin.lbbs.co.za/goals               → Personal goals & diary
admin.lbbs.co.za/reports             → Reports & exports
admin.lbbs.co.za/entities            → Entity Builder
admin.lbbs.co.za/settings            → System settings + user management
```

### URL Map — Student Portal
```
portal.lbbs.co.za/                   → Login page
portal.lbbs.co.za/dashboard          → Student dashboard (after login)
portal.lbbs.co.za/queries            → My queries list
portal.lbbs.co.za/queries/new        → Submit new query
portal.lbbs.co.za/queries/:id        → Query detail + status + responses
portal.lbbs.co.za/announcements      → Announcements for my modules
portal.lbbs.co.za/complaints/tutor   → Submit complaint against a tutor
```

### URL Map — Tutor Portal
```
portal.lbbs.co.za/tutor/             → Tutor login
portal.lbbs.co.za/tutor/dashboard    → Tutor dashboard
portal.lbbs.co.za/tutor/queries      → Queries in my assigned modules
portal.lbbs.co.za/tutor/queries/:id  → Respond to a query
portal.lbbs.co.za/tutor/students     → My assigned students
portal.lbbs.co.za/tutor/lab          → Lab bookings I manage
portal.lbbs.co.za/tutor/reports      → Submit session report to lecturer
portal.lbbs.co.za/tutor/announcements→ Announcements for my modules
```

---

## 6. Branding & Design System

### Colour Palette

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| Primary Background | Deep Charcoal | `#1F2937` | App background, nav, headers (60%) |
| Light Canvas | Soft Ivory | `#FFF8F0` | Cards, panels, content areas (30%) |
| CTA / Actions / Alerts | Vibrant Orange | `#FA7921` | Buttons, links, badges (10%) |
| Warm Dark Accent | Royal Amber | `#7D4600` | Section dividers, sub-headings, hover states |
| Highlight / Status | Warm Gold | `#FFE66D` | Warnings, highlights, in-progress badges |

### CSS Custom Properties
```css
:root {
  --color-bg-primary:    #1F2937;
  --color-bg-light:      #FFF8F0;
  --color-action:        #FA7921;
  --color-accent:        #7D4600;
  --color-highlight:     #FFE66D;
  --color-text-on-dark:  #FFF8F0;
  --color-text-on-light: #1F2937;
  --color-border:        rgba(255,255,255,0.1);
  --color-success:       #22c55e;
  --color-danger:        #ef4444;
  --color-info:          #3b82f6;

  --font-heading: 'Poppins', sans-serif;
  --font-body:    'Open Sans', sans-serif;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --shadow-card: 0 2px 12px rgba(0,0,0,0.15);
}
```

### Typography
```html
<!-- Google Fonts import -->
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
```
- **H1, H2, H3:** Poppins, weight 700
- **Body, labels, UI text:** Open Sans, weight 400
- **Bold UI labels:** Open Sans, weight 600

### Query Status Badge Colours

| Status | Colour |
|--------|--------|
| New | `#3b82f6` (blue) |
| Acknowledged | `#FFE66D` (Warm Gold) |
| In Progress | `#FA7921` (Vibrant Orange) |
| Resolved | `#22c55e` (green) |
| Closed | `rgba(255,255,255,0.3)` (muted) |

### Logo
- Provided as PNG/SVG by owner when development begins
- Until logo is provided: render "**LS PORT**" in Poppins Bold, with "LS" in `#FA7921` and "PORT" in `#FFF8F0`
- Logo placement: top-left of all three portals

---

## 7. User Roles & Permissions

### Role Hierarchy

```
SUPER ADMIN (Lecturer)
  └── STAFF ASSISTANT (configurable per-user)
         └── TUTOR (module-scoped)
                └── STUDENT (module-scoped)
```

### Permission Matrix

| Feature | Super Admin | Staff Assistant | Tutor | Student |
|---------|:-----------:|:---------------:|:-----:|:-------:|
| View all queries | ✅ | Configurable | Module-only | Own only |
| Respond to queries | ✅ | Configurable | Module-only | ❌ |
| Log interactions | ✅ | Configurable | ❌ | ❌ |
| View student list | ✅ | Configurable | Assigned only | ❌ |
| Upload class list | ✅ | Configurable | ❌ | ❌ |
| Post announcements | ✅ | Configurable | ❌ | ❌ |
| View announcements | ✅ | ✅ | Assigned modules | Own modules |
| Manage lab bookings | ✅ | ❌ | Assigned sessions | ❌ |
| Submit tutor report | ❌ | ❌ | ✅ | ❌ |
| Submit query | ❌ | ❌ | ❌ | ✅ |
| Submit tutor complaint | ❌ | ❌ | ❌ | ✅ |
| View tutor complaints | ✅ | ❌ | ❌ | ❌ |
| Generate reports | ✅ | Configurable | ❌ | ❌ |
| Entity Builder | ✅ | ❌ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ | ❌ |
| WhatsApp trigger | ✅ | Configurable | ❌ | ❌ |
| AI suggestions | ✅ | ✅ | ✅ | ❌ |

### Staff Assistant Configurable Permissions
When creating a staff user, the admin selects which of the following they can access:
- View queries (all / assigned modules only)
- Respond to queries
- View student lists
- Upload class lists
- Generate reports
- Manage module data
- View interaction logs

---

## 8. Authentication Flows

### 8.1 Super Admin Login (admin.lbbs.co.za)

```
1. Enter email + password
2. bcrypt verify against ADMIN_PASSWORD_HASH in .env
3. If match → prompt for TOTP (Google Authenticator 6-digit code)
4. speakeasy.totp.verify() → validate code with 30-second window
5. If valid → issue JWT (8h expiry) + store in httpOnly cookie
6. Redirect to dashboard
7. All admin routes protected by JWT middleware
```

**Google Authenticator Setup (one-time):**
```
1. Admin visits /admin/setup-2fa (first launch only)
2. System generates TOTP secret via speakeasy.generateSecret()
3. Displays QR code → scan with Google Authenticator app
4. Store secret encrypted in .env as TOTP_SECRET
5. /setup-2fa disabled after first use
```

### 8.2 Staff Assistant Login (admin.lbbs.co.za)

```
1. Enter student number + one-time password (assigned by admin)
2. On first login → force password change
3. No TOTP required for staff
4. JWT issued (8h) → scoped to their permission set
5. Dashboard filtered to their allowed modules/features
```

### 8.3 Student Login (portal.lbbs.co.za)

```
1. Enter student number
2. Select their course code from dropdown (pre-populated from uploaded class lists)
3. Enter password = last 4 digits of their SA ID number (set at account creation from class list upload)
4. System verifies: student_number + course_id match in enrollments table
5. bcrypt verify password (last 4 digits stored as bcrypt hash during class list import)
6. JWT issued (4h) → scoped to their student_id and enrolled course IDs
7. Redirect to student dashboard
```

**Password Reset (Student):**
- No self-service reset (avoid complexity)
- Student contacts lecturer/tutor
- Admin resets from admin panel → reverts to last 4 digits of ID

### 8.4 Tutor Login (portal.lbbs.co.za/tutor)

```
1. Enter student number (tutors are also students)
2. Select "Tutor" role on login page
3. Enter assigned password (set by admin, one-time code initially)
4. System checks: user exists in users table with role = 'tutor'
5. JWT issued (8h) → scoped to their tutor_id and assigned course IDs
6. Redirect to tutor dashboard
```

---

## 9. Database Architecture

### Database Summary

| Database | Contains |
|----------|---------|
| `lbbscoza_core` | Users, roles, permissions, Entity Builder tables, audit logs, system config |
| `lbbscoza_academic` | Students, courses, queries, announcements, interaction logs, academic calendar |
| `lbbscoza_work` | Tasks, meetings, research, consulting, departmental, supervision, staff, goals |
| `lbbscoza_lab` | Lab bookings, equipment, incidents |
| `lbbscoza_vehicles` | Vehicle hire records |

---

### 9.1 lbbscoza_core — Schema

```sql
-- Users (all portal types)
CREATE TABLE users (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_number  VARCHAR(20) UNIQUE NOT NULL,
  full_name       VARCHAR(150) NOT NULL,
  email           VARCHAR(200),
  password_hash   VARCHAR(255) NOT NULL,
  role            ENUM('super_admin','staff','tutor','student') NOT NULL,
  permissions_json JSON,            -- for staff: array of granted permission slugs
  is_active       TINYINT DEFAULT 1,
  totp_secret     VARCHAR(100),     -- super_admin only
  force_pw_change TINYINT DEFAULT 0,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login      TIMESTAMP NULL,
  data_expires_at DATE NULL         -- POPIA: auto-delete after 13 months
);

-- System configuration (key-value store)
CREATE TABLE system_config (
  config_key   VARCHAR(100) PRIMARY KEY,
  config_value TEXT NOT NULL,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Audit log
CREATE TABLE audit_logs (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      INT UNSIGNED,
  action       VARCHAR(100) NOT NULL,   -- e.g. 'query.status_changed'
  entity_type  VARCHAR(50),
  entity_id    INT UNSIGNED,
  details_json JSON,
  ip_address   VARCHAR(45),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- === ENTITY BUILDER TABLES ===

CREATE TABLE entity_types (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL,
  slug         VARCHAR(100) UNIQUE NOT NULL,
  icon         VARCHAR(50),             -- icon name (e.g. 'folder', 'user')
  description  TEXT,
  is_core      TINYINT DEFAULT 0,       -- 1 = pre-built, cannot be deleted
  is_active    TINYINT DEFAULT 1,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE entity_fields (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_type_id INT UNSIGNED NOT NULL,
  field_name     VARCHAR(100) NOT NULL,
  field_label    VARCHAR(150) NOT NULL,
  field_type     ENUM('text','textarea','number','date','datetime','boolean','dropdown','file','relation') NOT NULL,
  options_json   JSON,      -- for dropdown: {"options":["Option A","Option B"]}
                             -- for relation: {"entity_type_slug":"student"}
  is_required    TINYINT DEFAULT 0,
  field_order    SMALLINT DEFAULT 0,
  is_active      TINYINT DEFAULT 1,
  FOREIGN KEY (entity_type_id) REFERENCES entity_types(id)
);

CREATE TABLE entity_records (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entity_type_id INT UNSIGNED NOT NULL,
  created_by     INT UNSIGNED NOT NULL,
  updated_by     INT UNSIGNED,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (entity_type_id) REFERENCES entity_types(id)
);

CREATE TABLE entity_field_values (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  record_id    BIGINT UNSIGNED NOT NULL,
  field_id     INT UNSIGNED NOT NULL,
  value_text   TEXT,
  value_number DECIMAL(15,4),
  value_date   DATE,
  value_bool   TINYINT,
  file_path    VARCHAR(500),
  FOREIGN KEY (record_id) REFERENCES entity_records(id),
  FOREIGN KEY (field_id)  REFERENCES entity_fields(id)
);
```

---

### 9.2 lbbscoza_academic — Schema

```sql
-- Academic calendar
CREATE TABLE academic_years (
  id        SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  year      YEAR NOT NULL UNIQUE,
  is_active TINYINT DEFAULT 1
);

CREATE TABLE semesters (
  id               SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  academic_year_id SMALLINT UNSIGNED NOT NULL,
  semester_number  TINYINT NOT NULL,    -- 1 or 2
  start_date       DATE,
  end_date         DATE,
  is_active        TINYINT DEFAULT 1,
  UNIQUE KEY (academic_year_id, semester_number),
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id)
);

-- Courses (= Modules, e.g. ITS301)
CREATE TABLE courses (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code        VARCHAR(20) NOT NULL,
  name        VARCHAR(200) NOT NULL,
  semester_id SMALLINT UNSIGNED NOT NULL,
  description TEXT,
  is_active   TINYINT DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (semester_id) REFERENCES semesters(id)
);

-- Students (core profile, imported from UFH class list)
CREATE TABLE students (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_number  VARCHAR(20) UNIQUE NOT NULL,
  id_number       VARCHAR(20),           -- SA ID / Passport
  surname         VARCHAR(100) NOT NULL,
  names           VARCHAR(150) NOT NULL,
  email           VARCHAR(200),
  phone           VARCHAR(20),
  course_name     VARCHAR(200),
  qualification   VARCHAR(200),
  password_hash   VARCHAR(255) NOT NULL, -- bcrypt of last 4 digits of ID
  is_active       TINYINT DEFAULT 1,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_expires_at DATE NOT NULL          -- POPIA: 13 months after created_at
);

-- Student ↔ Course enrollments
CREATE TABLE course_enrollments (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id  INT UNSIGNED NOT NULL,
  course_id   INT UNSIGNED NOT NULL,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (student_id, course_id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (course_id)  REFERENCES courses(id)
);

-- Tutor → Course assignments
CREATE TABLE tutor_assignments (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,   -- FK to lbbscoza_core.users
  course_id   INT UNSIGNED NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (user_id, course_id),
  FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Query categories (admin-configurable)
CREATE TABLE query_categories (
  id        SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(100) NOT NULL,
  slug      VARCHAR(100) UNIQUE NOT NULL,
  is_active TINYINT DEFAULT 1
);
-- Seed: Marks/Grade Query, Submission Issue, Academic/Content Question, General/Other

-- Queries
CREATE TABLE queries (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id    INT UNSIGNED NOT NULL,
  course_id     INT UNSIGNED NOT NULL,
  category_id   SMALLINT UNSIGNED NOT NULL,
  subject       VARCHAR(300) NOT NULL,
  description   TEXT NOT NULL,
  urgency_level ENUM('low','medium','high','urgent') DEFAULT 'medium',
  status        ENUM('new','acknowledged','in_progress','resolved','closed') DEFAULT 'new',
  file_path     VARCHAR(500),          -- optional student attachment
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  closed_at     TIMESTAMP NULL,
  FOREIGN KEY (student_id)  REFERENCES students(id),
  FOREIGN KEY (course_id)   REFERENCES courses(id),
  FOREIGN KEY (category_id) REFERENCES query_categories(id)
);

-- Query messages (threaded conversation)
CREATE TABLE query_messages (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  query_id    BIGINT UNSIGNED NOT NULL,
  sender_type ENUM('admin','staff','tutor','student') NOT NULL,
  sender_id   INT UNSIGNED NOT NULL,
  message     TEXT NOT NULL,
  is_public   TINYINT DEFAULT 1,       -- 0 = admin-only note, student cannot see
  file_path   VARCHAR(500),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (query_id) REFERENCES queries(id)
);

-- Query status history (full audit trail)
CREATE TABLE query_status_history (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  query_id   BIGINT UNSIGNED NOT NULL,
  old_status VARCHAR(30),
  new_status VARCHAR(30) NOT NULL,
  changed_by INT UNSIGNED NOT NULL,
  notes      TEXT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (query_id) REFERENCES queries(id)
);

-- Interaction logs (multi-channel communication per student)
CREATE TABLE interaction_logs (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id  INT UNSIGNED NOT NULL,
  query_id    BIGINT UNSIGNED,          -- optional link to specific query
  channel     ENUM('whatsapp','email','blackboard','f2f','system_message') NOT NULL,
  direction   ENUM('sent','received','n/a') DEFAULT 'n/a',
  summary     TEXT NOT NULL,
  file_path   VARCHAR(500),
  logged_by   INT UNSIGNED NOT NULL,   -- admin or staff user id
  logged_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (query_id)   REFERENCES queries(id)
);

-- Announcements
CREATE TABLE announcements (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(300) NOT NULL,
  content      TEXT NOT NULL,
  target_type  ENUM('course','student','all') NOT NULL,
  created_by   INT UNSIGNED NOT NULL,
  is_pinned    TINYINT DEFAULT 0,
  is_active    TINYINT DEFAULT 1,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at   TIMESTAMP NULL
);

CREATE TABLE announcement_targets (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  announcement_id  INT UNSIGNED NOT NULL,
  target_id        INT UNSIGNED NOT NULL,  -- course_id or student_id
  FOREIGN KEY (announcement_id) REFERENCES announcements(id)
);

-- Read receipt / confirmation popup
CREATE TABLE announcement_read_receipts (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  announcement_id  INT UNSIGNED NOT NULL,
  student_id       INT UNSIGNED NOT NULL,
  read_at          TIMESTAMP NULL,
  confirmed_at     TIMESTAMP NULL,         -- when student clicked "I have read this"
  UNIQUE KEY (announcement_id, student_id),
  FOREIGN KEY (announcement_id) REFERENCES announcements(id),
  FOREIGN KEY (student_id)      REFERENCES students(id)
);

-- Tutor complaints (from students, private)
CREATE TABLE tutor_complaints (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id  INT UNSIGNED,              -- NULL if logged by admin on behalf
  tutor_id    INT UNSIGNED NOT NULL,     -- FK to lbbscoza_core.users
  course_id   INT UNSIGNED NOT NULL,
  description TEXT NOT NULL,
  file_path   VARCHAR(500),
  status      ENUM('received','under_review','resolved','dismissed') DEFAULT 'received',
  logged_by   INT UNSIGNED NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id)  REFERENCES courses(id),
  FOREIGN KEY (student_id) REFERENCES students(id)
);

-- Tutor session reports
CREATE TABLE tutor_reports (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tutor_id     INT UNSIGNED NOT NULL,
  course_id    INT UNSIGNED NOT NULL,
  report_date  DATE NOT NULL,
  session_type VARCHAR(100),
  summary      TEXT NOT NULL,
  student_count SMALLINT,
  notes        TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id)
);
```

---

### 9.3 lbbscoza_work — Schema

```sql
-- Tasks / To-Dos
CREATE TABLE tasks (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(300) NOT NULL,
  description   TEXT,
  entity_type   VARCHAR(50),    -- e.g. 'student', 'course', 'research_project'
  entity_id     INT UNSIGNED,
  due_date      DATE,
  priority      ENUM('low','medium','high','urgent') DEFAULT 'medium',
  status        ENUM('todo','in_progress','done','cancelled') DEFAULT 'todo',
  created_by    INT UNSIGNED NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at  TIMESTAMP NULL
);

-- Meetings
CREATE TABLE meetings (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(300) NOT NULL,
  meeting_date DATE NOT NULL,
  start_time  TIME,
  end_time    TIME,
  location    VARCHAR(300),
  agenda      TEXT,
  minutes     TEXT,
  entity_type VARCHAR(50),   -- link to any entity type
  entity_id   INT UNSIGNED,
  created_by  INT UNSIGNED NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE meeting_attendees (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  meeting_id  INT UNSIGNED NOT NULL,
  name        VARCHAR(150) NOT NULL,
  role        VARCHAR(100),
  is_external TINYINT DEFAULT 0,
  FOREIGN KEY (meeting_id) REFERENCES meetings(id)
);

-- Research projects
CREATE TABLE research_projects (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(300) NOT NULL,
  description TEXT,
  status      ENUM('planning','active','on_hold','completed','cancelled') DEFAULT 'planning',
  start_date  DATE,
  end_date    DATE,
  notes       TEXT,
  created_by  INT UNSIGNED NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE research_collaborators (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id  INT UNSIGNED NOT NULL,
  name        VARCHAR(150) NOT NULL,
  role        VARCHAR(100),
  institution VARCHAR(200),
  email       VARCHAR(200),
  FOREIGN KEY (project_id) REFERENCES research_projects(id)
);

CREATE TABLE research_milestones (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  project_id   INT UNSIGNED NOT NULL,
  title        VARCHAR(300) NOT NULL,
  due_date     DATE,
  completed_at DATE,
  notes        TEXT,
  FOREIGN KEY (project_id) REFERENCES research_projects(id)
);

-- Consulting engagements
CREATE TABLE consulting_engagements (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_name  VARCHAR(200) NOT NULL,
  contact_name  VARCHAR(150),
  contact_email VARCHAR(200),
  project_title VARCHAR(300) NOT NULL,
  description   TEXT,
  status        ENUM('proposal','active','completed','on_hold','cancelled') DEFAULT 'proposal',
  start_date    DATE,
  end_date      DATE,
  billing_notes TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departmental duties / committees
CREATE TABLE departmental_duties (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title          VARCHAR(300) NOT NULL,
  committee_name VARCHAR(200),
  role           VARCHAR(150),
  description    TEXT,
  start_date     DATE,
  end_date       DATE,
  is_active      TINYINT DEFAULT 1,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE departmental_meetings (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  duty_id     INT UNSIGNED NOT NULL,
  meeting_date DATE NOT NULL,
  agenda      TEXT,
  minutes     TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (duty_id) REFERENCES departmental_duties(id)
);

-- Staff and colleagues log
CREATE TABLE staff_colleagues (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(150) NOT NULL,
  surname         VARCHAR(100) NOT NULL,
  employee_number VARCHAR(30),
  department      VARCHAR(200),
  role            VARCHAR(150),
  email           VARCHAR(200),
  phone           VARCHAR(20),
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE staff_interactions (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  staff_id        INT UNSIGNED NOT NULL,
  channel         ENUM('whatsapp','email','f2f','phone','meeting','system') NOT NULL,
  direction       ENUM('sent','received','n/a') DEFAULT 'n/a',
  summary         TEXT NOT NULL,
  logged_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff_colleagues(id)
);

-- Supervision records
CREATE TABLE supervision_records (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  supervisee_name   VARCHAR(150) NOT NULL,
  supervisee_number VARCHAR(30),
  supervision_type  ENUM('honours','masters','phd','staff','other') NOT NULL,
  status            ENUM('on_track','behind','at_risk','completed','withdrawn') DEFAULT 'on_track',
  start_date        DATE,
  expected_end_date DATE,
  notes             TEXT,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE supervision_meetings (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  supervision_id  INT UNSIGNED NOT NULL,
  meeting_date    DATE NOT NULL,
  notes           TEXT,
  progress_summary TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supervision_id) REFERENCES supervision_records(id)
);

CREATE TABLE supervision_milestones (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  supervision_id  INT UNSIGNED NOT NULL,
  title           VARCHAR(300) NOT NULL,
  due_date        DATE,
  submitted_at    DATE,
  reviewed_at     DATE,
  notes           TEXT,
  FOREIGN KEY (supervision_id) REFERENCES supervision_records(id)
);

-- Personal goals and diary
CREATE TABLE personal_goals (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(300) NOT NULL,
  description TEXT,
  category    VARCHAR(100),
  target_date DATE,
  status      ENUM('active','achieved','abandoned') DEFAULT 'active',
  notes       TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE diary_entries (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  entry_date DATE NOT NULL,
  content    TEXT NOT NULL,
  tags       VARCHAR(500),   -- comma-separated tags
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

### 9.4 lbbscoza_lab — Schema

```sql
CREATE TABLE lab_equipment (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(200) NOT NULL,
  asset_tag        VARCHAR(50),
  type             VARCHAR(100),   -- Desktop, Laptop, Printer, etc.
  serial_number    VARCHAR(100),
  purchase_date    DATE,
  condition_status ENUM('good','fair','poor','broken','decommissioned') DEFAULT 'good',
  software_installed TEXT,          -- JSON array or free text list
  last_serviced    DATE,
  notes            TEXT,
  is_active        TINYINT DEFAULT 1,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lab_bookings (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booked_by_name VARCHAR(150) NOT NULL,
  student_number VARCHAR(20),
  course_id      INT UNSIGNED,
  booking_date   DATE NOT NULL,
  start_time     TIME NOT NULL,
  end_time       TIME NOT NULL,
  purpose        TEXT NOT NULL,
  attendee_count SMALLINT,
  approved_by    INT UNSIGNED,
  status         ENUM('pending','approved','rejected','completed','cancelled') DEFAULT 'pending',
  notes          TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lab_incidents (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  incident_date    DATE NOT NULL,
  incident_type    ENUM('damage','theft','technical_fault','software_issue','other') NOT NULL,
  description      TEXT NOT NULL,
  student_number   VARCHAR(20),
  equipment_id     INT UNSIGNED,
  severity         ENUM('low','medium','high','critical') DEFAULT 'medium',
  is_resolved      TINYINT DEFAULT 0,
  resolution_notes TEXT,
  logged_by        INT UNSIGNED NOT NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (equipment_id) REFERENCES lab_equipment(id)
);
```

---

### 9.5 lbbscoza_vehicles — Schema

```sql
CREATE TABLE vehicle_hire_records (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  hirer_name           VARCHAR(150) NOT NULL,
  hirer_surname        VARCHAR(100) NOT NULL,
  id_passport_number   VARCHAR(30) NOT NULL,
  employee_number      VARCHAR(30),
  faculty_department   VARCHAR(200) NOT NULL,  -- changes per hire
  email                VARCHAR(200),
  hire_start_date      DATE NOT NULL,
  hire_end_date        DATE NOT NULL,
  duration_days        SMALLINT,
  vehicle_reg          VARCHAR(20),
  vehicle_description  VARCHAR(200),
  pre_existing_damage  TEXT,
  declaration_text     TEXT,                   -- "I declare that..."
  signature_data       TEXT,                   -- base64 SVG or drawn signature
  pdf_path             VARCHAR(500),           -- generated PDF file path
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 10. Core Entity Definitions

### Pre-built Core Entities (is_core = 1 in entity_types)

| Entity | Table Location | Key Fields |
|--------|---------------|-----------|
| Student | lbbscoza_academic.students | student_number, id_number, surname, names, email, phone, course_name, qualification |
| Course/Module | lbbscoza_academic.courses | code, name, semester_id, description |
| Query | lbbscoza_academic.queries | student_id, course_id, category, description, status, urgency |
| Task | lbbscoza_work.tasks | title, description, entity link, due_date, priority, status |
| Meeting | lbbscoza_work.meetings | title, date, location, agenda, minutes, entity link |
| Announcement | lbbscoza_academic.announcements | title, content, target, pinned, expires |
| Research Project | lbbscoza_work.research_projects | title, description, status, collaborators, milestones |
| Consulting Engagement | lbbscoza_work.consulting_engagements | company, contact, title, status, billing_notes |
| Departmental Duty | lbbscoza_work.departmental_duties | committee, role, meetings |
| Staff/Colleague | lbbscoza_work.staff_colleagues | name, department, role, interaction log |
| Supervision | lbbscoza_work.supervision_records | supervisee, type, status, meetings, milestones |
| Personal Goal | lbbscoza_work.personal_goals | title, category, target_date, status |
| Lab Booking | lbbscoza_lab.lab_bookings | date, time, purpose, student, course |
| Lab Equipment | lbbscoza_lab.lab_equipment | name, type, condition, software, last serviced |
| Lab Incident | lbbscoza_lab.lab_incidents | type, description, equipment, severity |
| Vehicle Hire | lbbscoza_vehicles.vehicle_hire_records | hirer, dates, department, PDF output |
| Tutor | lbbscoza_core.users (role=tutor) + academic tables | assignments, reports, complaints |

---

## 11. Dynamic Entity Builder

### Purpose
Allows the admin to create entirely new entity types through the UI without any coding. New entity types are stored in the Entity Builder tables (`entity_types`, `entity_fields`) and rendered dynamically in both the admin list view and detail form.

### Admin UI Flow
```
1. Navigate to admin.lbbs.co.za/entities
2. Click "New Entity Type"
3. Fill in:
   - Name (e.g. "Conference Attendance")
   - Icon (icon picker)
   - Description
4. Add fields:
   - Field Label (e.g. "Conference Name")
   - Field Type (text / textarea / number / date / datetime / boolean / dropdown / file / relation)
   - If dropdown: enter options list
   - If relation: select which entity type to link to
   - Required toggle
   - Drag to reorder
5. Save → entity type appears in admin left navigation
6. Admin can create/view/edit/delete records of this type
7. Reports and exports work automatically for custom entities
```

### Field Types Supported

| Type | Database Column Used | UI Component |
|------|---------------------|--------------|
| text | value_text | Single-line input |
| textarea | value_text | Multi-line textarea |
| number | value_number | Numeric input |
| date | value_date | Date picker |
| datetime | value_date (+ time in value_text) | Datetime picker |
| boolean | value_bool | Toggle switch |
| dropdown | value_text | Select dropdown (options from options_json) |
| file | file_path | File upload button |
| relation | value_text (stores foreign entity ID) | Searchable dropdown of linked entity records |

### Rendering Engine
The frontend uses a single `DynamicEntityForm` React component that reads the `entity_fields` config and renders the appropriate input. The `DynamicEntityList` component generates a dynamic table from the same config. This means any new entity type is automatically viewable, searchable, and exportable.

---

## 12. Admin Portal — admin.lbbs.co.za

### 12.1 Dashboard

**Layout:** Top navigation bar + collapsible left sidebar + main content area.

**Dashboard Widgets (top to bottom):**
1. **Quick Actions Bar** — New Query Response | New Log Entry | New Announcement | New Task
2. **Open Queries Summary** — Count by status (New/Acknowledged/In Progress), clickable to filter
3. **Today's Tasks** — All tasks with due_date = today, sorted by priority
4. **Recent Activity** — Last 10 log entries across all entities (timestamp + what + who)
5. **Module Overview** — Table: Course Code | Course Name | Enrolled Students | Open Queries

### 12.2 Student Management

**Student List page:**
- Filter by: Course | Semester | Year | Status (active/inactive)
- Search by: Name, Surname, Student Number
- Bulk action: Export selected students to Excel
- Per student: quick link to their query history, interaction log

**Student Profile page:**
- Full details (from class list import)
- Tab: Queries (all queries submitted by this student, with status)
- Tab: Interaction Log (all channels: WhatsApp, Email, Blackboard, F2F, System Message)
- Tab: Announcements Seen (which announcements they confirmed reading)
- Button: "Log Interaction" → opens modal with channel selector
- Button: "Send WhatsApp" → copies message to clipboard + opens `https://wa.me/<phone>` in new tab
- Button: "Send Email" → sends email via UFH SMTP using system template

**Class List Upload:**
1. Admin → Courses → Select Course → "Upload Class List"
2. Upload Excel file (`.xlsx`)
3. **Column Mapper:** System reads first row headers → displays detected columns
4. Admin maps each column to: Surname / Names / Student Number / ID Number / Email / Phone / Course Name / Qualification / (Skip)
5. Preview first 5 rows
6. Confirm import → system creates student accounts, enrols in course
7. Password set automatically = bcrypt(last 4 digits of ID Number)
8. Duplicate student numbers update the record rather than creating a new one

### 12.3 Query Management

**Query List:**
- Filters: Status | Course | Category | Urgency | Date range
- Columns: #ID | Student | Course | Category | Subject | Urgency | Status | Date | Actions
- Colour-coded status badges
- Clicking a row opens Query Detail

**Query Detail:**
- Full student info header (name, number, course, contact)
- Query description + any attached file
- **Message Thread:** Full conversation history with timestamps. Public messages shown in thread. Private notes shown with lock icon (student cannot see).
- **Response Form:**
  - Toggle: Public Reply (student sees) | Private Note (admin only)
  - Text area with **AI Suggest button** (see Section 15)
  - File attachment option
  - Send button → creates `query_messages` record
- **Status Control:** Dropdown to change status → logs to `query_status_history` → triggers email to student
- **WhatsApp Button:** Copies latest message to clipboard + opens wa.me link for student's phone number
- **Log External Interaction:** Modal to log WhatsApp/Email/Blackboard/F2F channel + direction + summary

### 12.4 Announcements

**Announcement Editor:**
- Title + Content (rich text)
- Target: Course (multi-select) OR Specific Students (multi-select) OR All
- Pin toggle
- Expiry date (optional)
- AI Suggest button for content drafting
- Save → immediately visible on portal to targeted students
- Students see popup on next login / visit → must click "I have read and understood this" → logs to `announcement_read_receipts`

**Announcement List:**
- Shows: Title | Target | Read Count / Total Students | Date | Pinned
- Read Receipt Report: per announcement, download CSV of who confirmed reading

### 12.5 Work Diary Modules

Each module follows the same pattern: **List View** → **Detail/Form View** → **Related Records**

**Tasks:**
- Create task linked to any entity (student, course, research project, etc.)
- Priority levels with colour coding
- Status board (Kanban-style or list)
- Filter by: due today / overdue / by entity

**Meetings:**
- Create meeting with date/time/location
- Add attendees (freeform names + roles)
- Link to entity (e.g. "Research Project: AI in Education")
- Agenda and Minutes fields
- Export meeting minutes as PDF

**Research Projects:**
- Project list with status indicators
- Per project: Collaborators, Milestones timeline, Notes, Linked meetings

**Consulting Engagements:**
- Per engagement: company details, status, deliverables, billing notes
- Linked tasks and meetings

**Departmental Duties:**
- Committee/role listing
- Per duty: linked departmental meetings with minutes

**Supervision:**
- Per supervisee: type (Honours/Masters/PhD/Staff), progress status
- Supervision meetings log
- Milestone tracker with completion status
- Progress report generator (PDF)

**Staff & Colleagues:**
- Directory of colleagues with department/role
- Interaction log per colleague (channel + direction + summary)

**Personal Goals & Diary:**
- Goal list with target dates and categories
- Free-form diary entries with date, content, and tags

### 12.6 Lab Management

**Lab Bookings:**
- Calendar view (weekly) + list view
- Approve/Reject pending bookings
- Log who used the lab per session

**Equipment Register:**
- List all equipment with condition status colour coding
- Per item: full history of condition changes, service dates
- Filter: by type | condition | needs servicing

**Incident Log:**
- Log incident with type, severity, linked equipment + student
- Mark resolved with resolution notes
- Incident report export (PDF per incident)

### 12.7 Vehicle Hire Form Generator

1. Admin → Vehicles → "New Hire Record"
2. Form pre-fills: Hirer Name, Surname, ID/Passport, Employee Number, Email (all can be edited)
3. **Only these fields require input each time:** Faculty/Department, Hire Start Date, Hire End Date
4. Duration auto-calculates from dates
5. Signature pad (HTML canvas) for digital signature
6. Click "Generate PDF" → system generates formatted PDF from template
7. PDF saved to `/uploads/vehicles/` and linked to the record
8. Download button immediately available

### 12.8 Tutor Management

**Tutor List:**
- Add tutor: enter student number → system creates user account with role = 'tutor'
- Assign tutor to one or more courses
- Set initial one-time password (shown once, admin must share with tutor)
- Per tutor: view submitted reports, assigned students, any complaints against them

**Tutor Reports Inbox:**
- List of reports submitted by tutors
- Filter by: tutor | course | date
- Export to Excel

**Tutor Complaints:**
- Private to admin only
- List: Date | Student | Tutor | Course | Status
- Change status with notes
- Cannot be seen by tutor under any circumstance

### 12.9 Reports Centre

**Available Reports:**

| Report | Format | Description |
|--------|--------|-------------|
| Query Log | PDF + Excel | All queries filtered by date/course/status/student |
| Work Activity Summary | PDF + Excel | All logged actions this week/month |
| Module Status Report | PDF | Per-course: students, open queries, announcements |
| Student Interaction Log | PDF | All interactions per specific student |
| Announcement Read Report | Excel | Who confirmed reading each announcement |
| Lab Usage Report | Excel | Bookings and incidents by date range |
| Supervision Progress | PDF | Per supervisee: meetings, milestones, status |
| Tutor Activity | Excel | Tutor reports by module |
| Custom Export | Excel | User-defined: select entity + select fields + apply filters |

**Custom Export Builder:**
1. Select entity type (any core or custom entity)
2. Select columns (checkboxes from field list)
3. Apply filters (field conditions)
4. Preview row count
5. Download as .xlsx

---

## 13. Student Portal — portal.lbbs.co.za

### 13.1 Login Page

- LBBS logo + "LS Port" heading
- Fields: Student Number | Course (dropdown of active courses) | Password
- Login button
- "Forgot password?" → shows message to contact lecturer
- No self-registration (accounts are created via class list upload)

### 13.2 Student Dashboard

- Greeting: "Welcome, [Name]"
- **Open Queries widget** — count of my queries by status
- **Announcements** — latest 3 announcements for my courses (with unread indicator)
- **Quick Action:** "Submit a Query" button (prominent, Vibrant Orange)

### 13.3 My Queries

**Query List:**
- Columns: Subject | Course | Category | Status (badge) | Date Submitted | Last Updated
- Sorted by most recent

**Query Detail:**
- Full description shown
- Status history timeline (visual, with timestamps)
- Message thread (public messages only — admin private notes not shown)
- File attachment if submitted with query
- Student CANNOT re-open a closed query — must submit a new one

**Submit New Query:**
- Form fields:
  - Course (pre-selected if enrolled in one, dropdown if multiple)
  - Category (dropdown: Marks/Grade Query | Submission Issue | Academic Question | General/Other)
  - Subject (one-line title)
  - Description (textarea)
  - Urgency (Low / Medium / High / Urgent)
  - Method of Initial Communication (WhatsApp / Email / Blackboard / In Person / This Form)
  - File attachment (optional)
  - Student Details section (pre-filled from profile, read-only): Name, Surname, Student Number, Course, Email, Phone
- Submit → creates query record → admin receives no notification (checks dashboard)
- Confirmation: "Your query has been submitted. You will receive an email when it is updated."

### 13.4 Announcements

- List of all announcements targeting this student's courses or directly
- Pinned announcements at top
- On clicking any announcement: full content shown → **popup modal**: "I have read and understood this announcement" button → logs read receipt
- Already-confirmed announcements show green tick

### 13.5 Submit Tutor Complaint

- Accessible from student menu
- Form: Course | Tutor Name (dropdown of tutors in their course) | Description | File Upload (optional)
- Submitted with student's name and number
- Confirmation: "Your report has been received and will be reviewed by the lecturer privately."
- Student cannot view, edit, or withdraw submitted complaints

---

## 14. Tutor Portal — portal.lbbs.co.za/tutor

### Login
- Separate login form under `/tutor`
- Student number + password (assigned one-time code)
- Force password change on first login

### Tutor Dashboard
- Assigned courses list
- Unread announcements count
- Pending query responses in their modules
- Lab sessions upcoming

### Features Available to Tutors

**Announcements:** View announcements for assigned modules only. Same read-receipt popup as students.

**Student Queries:** View and respond to queries submitted in their assigned modules. Cannot change query status (status changes are admin-only). Can add public replies only (no private notes).

**Student List:** View names and student numbers of students in their assigned courses. No access to ID numbers, grades, or interaction logs.

**Lab Bookings:** View and manage lab bookings for their assigned sessions. Can mark sessions as completed.

**Session Reports:** Submit a session report to the lecturer:
- Course | Date | Session Type | Summary | Student Count | Notes
- Reports go directly to admin inbox
- Tutor can view their own submitted reports

---

## 15. AI Integration — Google Gemini

### API Details
- **Model:** `gemini-1.5-flash`
- **API Key:** Free tier — `https://aistudio.google.com/app/apikey`
- **Rate Limit (free):** 15 requests/minute, 1 million tokens/day
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`

### Where AI Suggest Button Appears

| Location | Context Sent to AI | Output |
|----------|-------------------|--------|
| Query Detail — Response box | Query subject, description, category, full message history | Suggested reply to student |
| Student Profile — Interaction log summary | Last 5 logged interactions (channel + summary) | Summary paragraph of all interactions |
| Tutor Feedback / Performance notes | Tutor name, course, recent session reports, any complaints | Draft performance note |

### Backend Implementation

```javascript
// POST /api/ai/suggest
async function generateSuggestion(contextType, contextData) {
  const prompts = {
    query_response: `
      You are a university lecturer responding to a student query.
      Query Category: ${contextData.category}
      Query Subject: ${contextData.subject}
      Student Description: ${contextData.description}
      Previous messages: ${contextData.messageHistory}
      
      Write a professional, helpful, and concise response to this student.
      Keep the tone supportive but academic. Under 150 words.
    `,
    interaction_summary: `
      You are summarising communication history between a lecturer and student.
      Interactions: ${JSON.stringify(contextData.interactions)}
      
      Write a 2-3 sentence factual summary of all interactions logged.
      Include channels used, direction, and key topics.
    `,
    tutor_feedback: `
      Write professional performance feedback for a tutor based on:
      Reports submitted: ${JSON.stringify(contextData.reports)}
      Complaints (if any): ${contextData.complaints}
      
      Keep feedback constructive and specific. Under 100 words.
    `
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompts[contextType] }] }]
      })
    }
  );

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
```

### UI Behaviour
- "✨ AI Suggest" button appears above relevant text areas
- Clicking shows a loading spinner ("Generating suggestion...")
- Suggestion appears in a preview box below the text area
- User can: "Use this" (copies into text area) | "Regenerate" | "Dismiss"
- User always edits before sending — AI is assistive, not auto-send

---

## 16. Notification System

### Email Notifications (Student-Facing Only)

Sent via Nodemailer using UFH SMTP credentials. The lecturer does NOT receive email notifications.

| Trigger | Recipient | Content |
|---------|-----------|---------|
| Query status changes | Student | "Your query [Subject] has been updated to: [New Status]" + link to portal |
| Admin sends a public message reply | Student | "A response has been added to your query [Subject]" + message preview |
| Announcement posted (high priority only) | Targeted students | "New announcement: [Title]" + content |

**Email Template Structure:**
```
[LBBS Logo / LS Port text logo]
[Poppins Bold Heading in #FA7921]
Body in Open Sans, on #FFF8F0 background
[CTA Button in #FA7921: "View on Portal"]
[Footer: portal.lbbs.co.za | lbbs.co.za]
```

### WhatsApp Trigger (Admin Side Only)

When admin clicks "Send WhatsApp" on a student's query or profile:

```javascript
// Frontend function
function openWhatsApp(phone, message) {
  // Copy message to clipboard
  navigator.clipboard.writeText(message);
  
  // Show toast: "Message copied to clipboard!"
  showToast('Message copied to clipboard — paste it in WhatsApp');
  
  // Open WhatsApp
  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
}
```

- No WhatsApp Business API required
- Works on desktop (opens web.whatsapp.com) and mobile (opens WhatsApp app)
- The pre-written message is auto-copied so the admin only needs to press Send in WhatsApp

---

## 17. Reporting & Exports

### PDF Reports
Generated using **Puppeteer** (headless Chrome, renders HTML → PDF):
- Server renders a styled HTML template
- Puppeteer converts to PDF with proper page breaks
- Saved temporarily to `/uploads/reports/` then streamed to browser

**PDF Header template (all reports):**
```
[LS Port logo/text]    [Report Title]    [Date Generated]
[Lecturer name + UFH]
────────────────────────────────────────────────────
[Content]
────────────────────────────────────────────────────
[Page X of Y]          [Confidential — lbbs.co.za]
```

### Excel Reports
Generated using **ExcelJS**:
- Styled headers in Deep Charcoal background / Soft Ivory text
- Auto-column widths
- Freeze top row
- Per-cell formatting based on data type

### Custom Export Engine
When admin uses the Custom Export Builder:
```
SELECT <selected_fields> 
FROM <entity_table> [JOIN entity_field_values WHERE conditions]
WHERE <applied_filters>
ORDER BY created_at DESC
```
The query builder constructs this dynamically from the admin's UI selections.

---

## 18. PDF Generator — Vehicle Hire Form

### Template Fields (Static vs Dynamic)

| Field | Static? | Notes |
|-------|---------|-------|
| Hirer Name | Usually static | Pre-filled from last record |
| Hirer Surname | Usually static | Pre-filled from last record |
| ID/Passport Number | Usually static | Pre-filled from last record |
| Employee Number | Usually static | Pre-filled from last record |
| Email | Usually static | Pre-filled from last record |
| Faculty / Department | **CHANGES** | Admin selects/types each time |
| Hire Start Date | **CHANGES** | Date picker |
| Hire End Date | **CHANGES** | Date picker |
| Duration | Auto-calculated | End - Start in days |
| Declaration | Static text | "I [Name] declare that I have inspected the vehicle..." |
| Signature | Required each time | HTML canvas signature pad |

### PDF Output Format
- A4 portrait
- University letterhead style with LBBS branding
- Formal declaration text in legal-style paragraph
- Signature block at bottom
- Generation date + record number as reference
- Download as: `VehicleHire_[Date]_[EmployeeNumber].pdf`

---

## 19. PWA Configuration

### Manifest (`/public/manifest.json`)
```json
{
  "name": "LBBS Student Portal",
  "short_name": "LS Port",
  "description": "LBBS Lecturer Work Management System",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1F2937",
  "theme_color": "#FA7921",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Service Worker
- **Cache strategy:** Network-first for API calls, Cache-first for static assets
- **Offline page:** Show "You are offline — please reconnect to submit or view queries"
- **Install prompt:** Show "Add LS Port to Home Screen" banner on mobile after 2 visits

### Separate Manifests
- `admin.lbbs.co.za` → manifest with `short_name: "LS Admin"`, dark icon variant
- `portal.lbbs.co.za` → manifest with `short_name: "LS Port"`, standard icon

---

## 20. Security Implementation

### Admin Panel
- Password + TOTP (Google Authenticator) mandatory for Super Admin
- JWT stored in httpOnly cookie (not localStorage — prevents XSS theft)
- All admin routes protected by `requireAuth` + `requireRole('super_admin')` middleware
- Rate limiting on `/admin/login`: max 5 attempts per 15 minutes (block IP on exceed)
- HTTPS enforced via cPanel SSL (HTTP redirects to HTTPS)

### Student Portal
- Rate limiting on `/login`: 10 attempts per 15 minutes per IP
- JWT in httpOnly cookie, 4-hour expiry
- Students can only access their own data (enforced at API level by comparing JWT student_id with requested resource)
- Student ID numbers never exposed in API responses after login

### General Security
- All user inputs sanitised with `validator.js` and parameterised SQL queries (via Knex.js)
- File uploads: whitelist extensions (pdf, doc, docx, jpg, png, xlsx) + size limit 10MB
- CORS: `admin.lbbs.co.za` only accepts requests from same origin; `portal.lbbs.co.za` same
- Helmet.js: sets security headers (Content-Security-Policy, X-Frame-Options, etc.)
- Audit log records every admin action with IP address

### Password Policy
- Admin: minimum 12 characters, must include uppercase, number, symbol
- Staff: minimum 8 characters (forced change on first login)
- Tutors: same as staff
- Students: last 4 digits of ID (auto-set, reset by admin only)

---

## 21. POPIA & Data Retention

### Data Deletion Policy
All personal data (student records, interaction logs, queries) must be deleted or anonymised **13 months** after the date of creation.

### Implementation

**At import:** For every student record created, `data_expires_at = DATE_ADD(created_at, INTERVAL 13 MONTH)` is set.

**Scheduled Job (runs daily at 02:00 SAST):**
```javascript
cron.schedule('0 2 * * *', async () => {
  const today = new Date().toISOString().split('T')[0];
  
  // Get all expired students
  const expired = await db('students').where('data_expires_at', '<=', today);
  
  for (const student of expired) {
    // Delete interaction logs
    await db('interaction_logs').where('student_id', student.id).delete();
    // Delete query messages
    // Delete queries
    // Delete enrollments
    // Anonymise student record (replace PII with 'DELETED')
    await db('students').where('id', student.id).update({
      id_number: 'DELETED',
      email: 'DELETED',
      phone: 'DELETED',
      password_hash: 'DELETED',
      is_active: 0,
      data_expires_at: null
    });
  }
  
  // Log POPIA deletion event in audit_logs
  await logAudit(0, 'popia.auto_delete', 'student', null, { count: expired.length });
});
```

### Data Retention by Type

| Data Type | Retention Period | Rationale |
|-----------|-----------------|-----------|
| Student PII (ID, phone) | 13 months | POPIA minimum |
| Query messages | 13 months (with student) | Linked to student data |
| Interaction logs | 13 months | Personal communication |
| Vehicle hire records | 5 years | Financial/legal |
| Consulting records | 5 years | Financial/legal |
| Audit logs | 3 years | Security compliance |
| Admin work diary (tasks, meetings) | Indefinite | Personal work records |

---

## 22. Backup Strategy

### Weekly Automated Backup (cPanel Cron Job)

**Cron schedule:** Every Sunday at 01:00 SAST
```
0 1 * * 0 /home/lbbscoza/scripts/backup.sh
```

**Backup script (`backup.sh`):**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR="/home/lbbscoza/backups/$DATE"
mkdir -p $BACKUP_DIR

# Dump all 5 databases
for DB in lbbscoza_core lbbscoza_academic lbbscoza_work lbbscoza_lab lbbscoza_vehicles; do
  mysqldump -u root -p$DB_PASS $DB > "$BACKUP_DIR/${DB}_${DATE}.sql"
done

# Backup uploads folder
tar -czf "$BACKUP_DIR/uploads_${DATE}.tar.gz" /home/lbbscoza/uploads/

# Delete backups older than 8 weeks
find /home/lbbscoza/backups/ -type d -mtime +56 -exec rm -rf {} +

echo "Backup complete: $DATE" >> /home/lbbscoza/logs/backup.log
```

### Manual Backup
Admin can also trigger a manual backup from `admin.lbbs.co.za/settings` → "Download Backup Now" → downloads all 5 SQL dumps as a single `.zip`.

---

## 23. Build Phases & Roadmap

### Phase 1 — Infrastructure & Authentication
**Deliverables:**
- Node.js app skeleton on cPanel
- Both subdomains live with SSL
- MySQL databases created with schemas
- Admin login (password + Google Authenticator TOTP)
- JWT middleware
- Basic admin dashboard shell (layout, nav, no data)

**Test:** Admin can log in with 2FA. Visiting admin.lbbs.co.za without login redirects to login page.

---

### Phase 2 — Student & Course Management
**Deliverables:**
- Course / semester / academic year management
- Class list Excel upload with column mapper
- Student profile pages
- Student login on portal (student number + last 4 ID digits + course selector)
- Basic student dashboard (empty state)

**Test:** Upload a real class list → students appear → one student logs into portal.

---

### Phase 3 — Query System
**Deliverables:**
- Student submits query (all fields + file upload)
- Admin query list with filters and status badges
- Query detail with message thread
- Admin responds (public + private notes)
- Status change workflow (New → Acknowledged → In Progress → Resolved → Closed)
- Status history timeline visible on student portal
- Email notification to student on status change
- WhatsApp clipboard trigger button
- Log external interaction (all 5 channels)

**Test:** Student submits query → admin responds → student sees response → admin changes status → student receives email.

---

### Phase 4 — Announcements
**Deliverables:**
- Admin creates announcement (course-targeted or student-targeted)
- Pin / expiry date support
- Read-receipt confirmation popup on student portal
- Admin view of who confirmed reading

**Test:** Post announcement to a course → student logs in → popup appears → student confirms → admin sees read receipt.

---

### Phase 5 — Tutor System
**Deliverables:**
- Tutor accounts (created by admin, student number login)
- Tutor portal (separate from student portal)
- Tutor dashboard with assigned courses
- Tutors respond to queries in their modules
- Session report submission
- Lab booking management for tutors
- Student complaint submission (against tutor)
- Tutor complaint inbox (admin only, private)

**Test:** Tutor logs in → sees only their module's queries → submits session report → admin sees it in inbox.

---

### Phase 6 — Work Diary Modules
**Deliverables:**
- Tasks / To-Dos with entity linking
- Meetings log with attendees + minutes
- Research Projects + collaborators + milestones
- Consulting Engagements
- Departmental Duties + committee meetings
- Supervision Records + meetings + milestones
- Staff/Colleagues directory + interaction log
- Personal Goals + Diary entries

**Test:** Create a task linked to a research project → create a meeting with minutes → export meeting minutes as PDF.

---

### Phase 7 — Lab & Vehicle Management
**Deliverables:**
- Lab equipment register
- Lab booking system (calendar + list)
- Incident log
- Vehicle hire record form
- PDF generator for vehicle hire form (pre-filled template)
- Signature pad integration

**Test:** Create vehicle hire record with new dates → generate PDF → download opens correct document.

---

### Phase 8 — Reports & Exports
**Deliverables:**
- All pre-defined reports (PDF + Excel)
- Custom Export Builder
- Scheduled POPIA deletion job

**Test:** Generate "Query Log" PDF for a specific course → export student list to Excel → custom export 3 fields from supervision records.

---

### Phase 9 — Dynamic Entity Builder
**Deliverables:**
- Entity Builder UI (create type, add fields, manage dropdowns)
- Dynamic list view for custom entities
- Dynamic form view for custom entity records
- Custom entities included in Custom Export Builder

**Test:** Create entity type "Conference Attendance" with 5 fields → add a record → view in list → export to Excel.

---

### Phase 10 — AI, PWA & Hardening
**Deliverables:**
- Google Gemini integration (query suggestions, interaction summaries, tutor feedback)
- PWA manifests for both portals
- Service worker + offline page
- Install prompt (Add to Home Screen)
- Full security audit (rate limiting, headers, input validation review)
- Backup cron job activated
- Audit log viewer in admin settings

**Test:** On mobile, open portal → install to home screen → go offline → see offline page → come back online → submit query normally.

---

## Appendix A — Query Status Email Templates

**Status: Acknowledged**
> Subject: Query Received — [Query Subject]
> "Dear [Name], your query regarding [Subject] has been received and acknowledged. We will review it and get back to you. Track your query at portal.lbbs.co.za"

**Status: In Progress**
> Subject: Query Update — [Query Subject]
> "Dear [Name], your query is currently being reviewed. You may receive a message on this portal shortly."

**Status: Resolved**
> Subject: Query Resolved — [Query Subject]
> "Dear [Name], your query has been resolved. Please log in to portal.lbbs.co.za to view the full response. If you have further questions, please submit a new query."

**Status: Closed**
> Subject: Query Closed — [Query Subject]
> "Dear [Name], your query has been closed. Thank you for reaching out."

---

## Appendix B — System Configuration Defaults (seeded on first run)

| Key | Default Value |
|-----|--------------|
| system_name | LBBS Student Portal |
| system_short_name | LS Port |
| active_academic_year | 2025 |
| active_semester | 1 |
| popia_retention_months | 13 |
| backup_retention_weeks | 8 |
| query_categories | Marks/Grade Query, Submission Issue, Academic/Content Question, General/Other |
| query_statuses | new, acknowledged, in_progress, resolved, closed |
| email_from_name | LS Port — LBBS |
| max_file_upload_mb | 10 |
| allowed_file_types | pdf,doc,docx,jpg,jpeg,png,xlsx |

---

*End of Specification — LBBS Student Portal (LS Port) v1.0*
*All 57 requirements gathered and documented. Ready for development.*
