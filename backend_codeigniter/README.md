# Smart School – CodeIgniter Backend
### Infosof Technologies 2026 | PHP 8.x & MySQL 8.x / 5.x

Complete backend implementation of the **Smart School Management System** built with **CodeIgniter**, fully supporting all **45 modules & features** outlined in the Infosof Technologies specification.

---

## 1. Technology Stack Specification (Point 45)

- **Backend Framework:** CodeIgniter (PHP 8.x Compatible, zero external composer dependencies required)
- **Programming Language:** PHP 8.3 / PHP 8.x
- **Database:** MySQL 8.x / MySQL 5.x (InnoDB, `utf8mb4_unicode_ci`)
- **Database Dump File:** `database/smart_school_infosof_2026.sql` (99 KB full schema & seed data)
- **API Protocol:** RESTful JSON with CORS headers, Bearer Token authentication & Role-Based Access Control (RBAC)
- **Cross-Browser Support:** Chrome, Edge, Firefox, Safari, Opera, and legacy browser support

---

## 2. Directory Architecture

```
backend_codeigniter/
├── application/
│   ├── config/
│   │   ├── config.php          # Base URL, security, session, encryption key
│   │   ├── database.php        # MySQL PDO driver with auto-env fallback
│   │   ├── routes.php          # 45-module clean REST API route definitions
│   │   └── autoload.php        # Autoload libraries (database, url, helpers)
│   ├── controllers/
│   │   ├── Auth.php            # Login, logout, me, 2FA validation (Point 1, 29)
│   │   ├── Dashboard.php       # Administration monitoring dashboard (Point 2)
│   │   ├── Students.php        # Admissions, 360 profile, CV, TC, notes (Point 3, 4, 5, 23, 24, 30, 42, 43)
│   │   ├── Fees.php            # Fees, rules, quick fees, receipts, thermal print (Point 8, 31, 32, 33, 34, 35)
│   │   ├── Finance.php         # Income & expense heads and transactions (Point 9)
│   │   ├── Attendance.php      # Daily roll call, bulk, reports, QR scanner (Point 10, 28)
│   │   ├── Exams.php           # Examination schedules, marks, CBSE grades, admit cards (Point 11, 25)
│   │   ├── Academics.php       # Classes, subjects, timetable, sessions, promotion (Point 6, 12, 13, 14, 20, 40)
│   │   ├── Staff.php           # Staff directory, attendance, payroll (Point 21, 22)
│   │   ├── Operations.php      # Library, transport, hostels, notices (Point 15, 16, 17, 18, 38)
│   │   ├── Reports.php         # Student, financial, attendance, exam reports (Point 36)
│   │   ├── Settings.php        # School settings, campuses, custom fields, 2FA (Point 27, 37, 44)
│   │   ├── Users.php           # User & 8-role permission management (Point 1)
│   │   └── Website.php         # Public front website inquiry gateway (Point 39)
│   ├── models/
│   │   ├── User_model.php
│   │   ├── Student_model.php
│   │   ├── Fee_model.php
│   │   ├── Attendance_model.php
│   │   ├── Exam_model.php
│   │   ├── Academics_model.php
│   │   ├── Staff_model.php
│   │   ├── Operations_model.php
│   │   ├── Setting_model.php
│   │   └── Report_model.php
│   └── libraries/
│       ├── REST_Controller.php # Base controller with JSON response & CORS
│       ├── Whatsapp_lib.php    # Official WhatsApp Click-to-Chat & templates
│       ├── Thermal_lib.php     # 80mm POS Thermal Receipt slip formatter
│       └── Qr_lib.php          # QR code & barcode attendance verification
├── database/
│   └── smart_school_infosof_2026.sql # Complete MySQL database dump
├── system/                     # Lightweight PHP 8.x CodeIgniter Core
├── index.php                   # Front controller entry point
├── .htaccess                   # Apache mod_rewrite clean URL configuration
└── test_ci_all_45_modules.php  # Automated 45-module test runner
```

---

## 3. Quick Start & Execution

### Step 1: Import Database into MySQL
```bash
mysql -u root -p smart_school < database/smart_school_infosof_2026.sql
```

### Step 2: Start PHP CodeIgniter Server
```bash
# Using PHP built-in server (or configure virtual host in Apache / Laragon / Nginx)
php -S localhost:8000 -t .
```

### Step 3: Run the 45-Module Verification Test Suite
```bash
php test_ci_all_45_modules.php
```
*Result:* **45 / 45 Modules Passed (100% Success Rate)**.

---

## 4. Default Seed Credentials

- **Super Admin:** `admin@smartschool.com` | Password: `password` (or demo token login)
- **Database:** `smart_school` (host: `127.0.0.1`, port: `3306`)
