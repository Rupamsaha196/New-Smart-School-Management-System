





# 🚀 Smart School Management System – cPanel Deployment Guide

**Infosof Technologies 2026 | Enterprise School ERP**  
*Technology Stack: HTML5 / Modern CSS / Vanilla JS (SPA Frontend) + CodeIgniter 3 PHP (REST API Backend) + MySQL 8.x / 5.7+*

---

## 📋 System Requirements on cPanel

- **Web Server:** Apache (with `mod_rewrite` and `mod_headers` enabled by default on cPanel)
- **PHP Version:** PHP 7.4, 8.0, 8.1, 8.2, or 8.3
- **PHP Extensions:** `pdo_mysql`, `mysqli`, `curl`, `json`, `mbstring`, `fileinfo` (standard on cPanel)
- **Database:** MySQL 5.7+ or MariaDB 10.3+ / MySQL 8.0+

---

## 📦 What Has Been Configured & Cleaned

1. **Removed Unused Laravel Directory:** The obsolete `backend/` folder (50MB+ and 8,900+ unused files) has been completely removed to prevent confusion.
2. **Authoritative Database Dump:** The entire database has been exported with **all dummy data intact** (all 56 tables, all students including **Rupam Saha**, classes, teachers, timetable, fee records with Razorpay transactions, settings, and permissions) into [`database/smart_school_database_cpanel_2026.sql`](file:///c:/Users/RUPAM/OneDrive/Desktop/Smart-School-Management-System/database/smart_school_database_cpanel_2026.sql).
3. **Automated cPanel Routing:** Root [`.htaccess`](file:///c:/Users/RUPAM/OneDrive/Desktop/Smart-School-Management-System/.htaccess) and [`index.php`](file:///c:/Users/RUPAM/OneDrive/Desktop/Smart-School-Management-System/index.php) automatically route API requests to CodeIgniter and serve frontend assets seamlessly with zero CORS issues.
4. **Environment Configuration (.env):** Added `.env` auto-loader in CodeIgniter, allowing you to configure database credentials simply by creating a `.env` file or editing `database.php`.
5. **Instant Deploy Package:** Pre-compressed [`smart_school_cpanel_ready.zip`](file:///c:/Users/RUPAM/OneDrive/Desktop/Smart-School-Management-System/smart_school_cpanel_ready.zip) (under 600 KB) ready for instant upload.

---

## 🛠️ Step-by-Step Deployment Instructions

### Step 1: Upload Files to cPanel

1. Log in to your **cPanel Dashboard**.
2. Open **File Manager**.
3. Navigate to:
   - `public_html/` (if deploying to your primary domain: `https://yourcompany.com`)
   - OR your subdomain folder (e.g. `public_html/school/` or `school.yourcompany.com`).
4. Click **Upload** in the top toolbar.
5. Upload [`smart_school_cpanel_ready.zip`](file:///c:/Users/RUPAM/OneDrive/Desktop/Smart-School-Management-System/smart_school_cpanel_ready.zip).
6. Right-click the uploaded `.zip` file and select **Extract**.
7. Ensure files are extracted directly into your root directory:
   ```text
   public_html/
   ├── .htaccess
   ├── .env.example
   ├── index.php
   ├── README.md
   ├── database/
   │   └── smart_school_database_cpanel_2026.sql
   ├── frontend/
   │   ├── index.html
   │   ├── css/
   │   ├── js/
   │   └── assets/
   └── backend_codeigniter/
       ├── application/
       ├── system/
       ├── index.php
       └── router.php
   ```

---

### Step 2: Create MySQL Database in cPanel

1. In cPanel, navigate to **Databases** ➔ **MySQL® Database Wizard** (or **MySQL® Databases**).
2. **Create New Database:**
   - Database Name: `school` (Full name will be e.g. `yourprefix_school`).
   - Click **Next Step**.
3. **Create Database User:**
   - Username: `dbuser` (Full username will be e.g. `yourprefix_dbuser`).
   - Generate or enter a strong **Password**. Save this password.
   - Click **Create User**.
4. **Assign User to Database:**
   - Check the **ALL PRIVILEGES** checkbox.
   - Click **Make Changes**.

---

### Step 3: Import Dummy Data via phpMyAdmin

1. Return to the cPanel Home and click **phpMyAdmin** (under Databases).
2. From the left sidebar, click on your newly created database (e.g., `yourprefix_school`).
3. Click on the **Import** tab at the top.
4. Click **Choose File** and select `smart_school_database_cpanel_2026.sql` (found inside the `database/` folder).
5. Ensure the character set is set to **utf-8** and format is **SQL**.
6. Click **Import** (or **Go**) at the bottom.
7. You should see a green success message: *"Import has been successfully finished, 56 tables imported."*

---

### Step 4: Configure Database Credentials

You have two easy ways to set your database credentials:

#### Option A (Recommended): Create `.env` file
In cPanel File Manager:
1. Copy or rename `.env.example` to `.env` in the root folder (or inside `backend_codeigniter/`).
2. Edit `.env` and update the values:
   ```ini
   CI_ENV=production
   APP_URL=https://school.yourcompany.com

   DB_HOST=localhost
   DB_PORT=3306
   DB_DATABASE=yourprefix_school
   DB_USERNAME=yourprefix_dbuser
   DB_PASSWORD=your_db_password_here
   ```
3. Save changes.

#### Option B: Edit `backend_codeigniter/application/config/database.php`
Open [`backend_codeigniter/application/config/database.php`](file:///c:/Users/RUPAM/OneDrive/Desktop/Smart-School-Management-System/backend_codeigniter/application/config/database.php) and set:
```php
$db['default'] = [
    'hostname'     => 'localhost',
    'username'     => 'yourprefix_dbuser',
    'password'     => 'your_db_password_here',
    'database'     => 'yourprefix_school',
    ...
];
```

---

### Step 5: Verify Live Deployment

Open your browser and navigate to your website: `https://school.yourcompany.com`

1. **Dashboard & Auth Check:**
   - **Super Admin:** `superadmin@smartschool.com` / `password123`
   - **Accountant:** `accountant@smartschool.com` / `password123`
   - **Teacher:** `teacher@smartschool.com` / `password123`
2. **Student & Dummy Data Check:**
   - Go to **Student Information** ➔ All 8 dummy students will load instantly.
   - Go to **Fee Collection / Cashier Desk** ➔ Search for `Rupam` or admission number `SS2026730`.
   - Outstanding dues, previous payments, and thermal receipt buttons will be visible immediately.
3. **Razorpay Payment Gateway Check:**
   - In the Cashier Desk, select any pending fee and click **Collect Fee (Razorpay)**.
   - The Razorpay checkout dialog will open seamlessly!

---

## 🔒 Post-Deployment Security Recommendations

1. Ensure file permissions in cPanel File Manager:
   - Folders: `755`
   - Files: `644`
2. The root `.htaccess` already blocks web visitors from directly reading `.env`, `.git`, or the `database/` folder.
3. To switch Razorpay from Test to Live mode, navigate to **Settings** ➔ **System Settings** in the dashboard and enter your live Razorpay Key ID and Secret Key.
