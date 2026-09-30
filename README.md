# Smart School – School Management System
### Infosof Technologies 2026 | Full Stack Architecture & 45 Modules

Complete, end-to-end Enterprise School Management System supporting all **45 modules & features** outlined in the Infosof Technologies specification.

---

> [!TIP]
> **Deployment Guide:**
> - 🌐 **cPanel Deployment:** [CPANEL_DEPLOYMENT_GUIDE.md](file:///c:/Users/RUPAM/OneDrive/Desktop/Smart-School-Management-System/CPANEL_DEPLOYMENT_GUIDE.md) — Step-by-step Apache, MySQL phpMyAdmin import, and `.env` configuration.
> - 📦 **Instant Deployment Archive:** `smart_school_cpanel_ready.zip` (Pre-compressed, ready to upload & extract directly into `public_html`).

---

## 1. Technology Stack Specification (Point 45)

- **Backend Framework:** CodeIgniter (PHP 8.x Compatible)
- **Backend Runtime:** PHP 8.3 / PHP 8.x
- **Database:** MySQL 8.x / MySQL 5.x (InnoDB, `utf8mb4_unicode_ci`)
- **Database Schema Dump:** `backend_codeigniter/database/smart_school_infosof_2026.sql` (99 KB full schema & seed data)
- **Frontend Stack:** Standard HTML5 / CSS3 / JavaScript (Browser-native, zero build steps, no Node/npm dependencies required)
- **Files:** PHP, SQL, JS, JSON, HTML, CSS
- **Cross-Browser Support:** Chrome, Edge, Firefox, Safari, Opera, and legacy browser support

---

## 2. Project Directory Structure

```
Smart-School-Management-System/
├── frontend/                     # Pure HTML5 / CSS3 / JavaScript Client
│   ├── index.html                # App entry point
│   ├── css/
│   │   └── style.css             # Unified CSS Design System & Theme
│   ├── js/
│   │   ├── app.js                # Core runtime, router, WhatsApp & layout
│   │   ├── views-students.js     # Admissions, 360 profile, CV, TC, behavior
│   │   ├── views-academics.js    # Classes, timetable, downloads, live classes, promotion
│   │   ├── views-attendance.js   # Daily register, reports, QR scanner
│   │   ├── views-exams.js        # Schedules, marks, CBSE grades, admit cards
│   │   ├── views-finance.js      # Fee rules, counter, income/expenses
│   │   ├── views-staff.js        # Staff directory & attendance
│   │   ├── views-operations.js   # Library, transport, hostel, notices, mobile app, website
│   │   ├── views-reports.js      # Executive analytics reports hub
│   │   └── views-settings.js     # School settings, custom fields, 2FA
│   └── assets/                   # Vector SVGs, icons, favicons
│
├── backend_codeigniter/          # CodeIgniter 3.x / PHP 8.x Backend
│   ├── application/
│   │   ├── config/               # config.php, database.php, routes.php, autoload.php
│   │   ├── controllers/          # 14 REST API Controllers covering Points 1–45
│   │   ├── models/               # 10 Data Models handling MySQL operations
│   │   └── libraries/            # REST_Controller, Whatsapp_lib, Thermal_lib, Qr_lib
│   ├── database/
│   │   └── smart_school_infosof_2026.sql # Complete MySQL database dump
│   ├── system/                   # CodeIgniter Core (PHP 8.x Compatible)
│   ├── index.php                 # Front controller entry point
│   ├── .htaccess                 # Apache mod_rewrite rules
│   └── test_ci_all_45_modules.php# Automated test runner (45 / 45 PASSED)
│
├── backend/                      # Alternative PHP Backend
│   └── test_all_44_modules.php   # Automated test runner (44 / 44 PASSED)
└── README.md
```

---

## 3. Quick Start Guide

### Step 1: Database Setup (MySQL)
1. Ensure your MySQL server (MySQL 8.x or 5.x) is running.
2. Create the database:
   ```sql
   CREATE DATABASE smart_school CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Import the SQL dump:
   ```bash
   mysql -u root -p smart_school < backend_codeigniter/database/smart_school_infosof_2026.sql
   ```

### Step 2: Run CodeIgniter Backend
```bash
cd backend_codeigniter
php -S localhost:8000 -t .
```

### Step 3: Run Frontend
Open `frontend/index.html` in your browser, or start a local static HTTP server:
```bash
cd frontend
python -m http.server 5500
```
Visit: `http://localhost:5500/index.html#/dashboard`

---

## 4. Verification Test Results

- **CodeIgniter 45-Module Automation Suite:**
  ```bash
  cd backend_codeigniter
  php test_ci_all_45_modules.php
  ```
  **Result:** `45 / 45 Passed (100% Success Rate)`.
