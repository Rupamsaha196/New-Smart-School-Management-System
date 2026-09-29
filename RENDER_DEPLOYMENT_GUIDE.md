# Render Cloud Deployment Guide
## Smart School Management System
### Infosof Technologies | Academic Year 2026–27

---

> [!IMPORTANT]
> **Stack:** Vanilla JS SPA + CodeIgniter 3.x REST API + MySQL 8.x  
> **Deployment Model:** Single Docker Web Service on [Render.com](https://render.com)  
> **Free Tier Compatibility:** 100% compatible with Render Free Tier (750 free instance hours/month)  
> **Repository Ready:** [Dockerfile](file:///c:/Users/RUPAM/OneDrive/Desktop/Smart-School-Management-System/Dockerfile), [docker-entrypoint.sh](file:///c:/Users/RUPAM/OneDrive/Desktop/Smart-School-Management-System/docker-entrypoint.sh), [render.yaml](file:///c:/Users/RUPAM/OneDrive/Desktop/Smart-School-Management-System/render.yaml), and [migrate.php](file:///c:/Users/RUPAM/OneDrive/Desktop/Smart-School-Management-System/migrate.php) are already pre-configured in this repository.

---

## Table of Contents

1. [Architecture on Render](#1-architecture-on-render)
2. [Database Provisioning (MySQL)](#2-database-provisioning-mysql)
3. [Step-by-Step Deployment Instructions](#3-step-by-step-deployment-instructions)
4. [One-Click Database Migration & Seeding](#4-one-click-database-migration--seeding)
5. [Environment Variables Reference](#5-environment-variables-reference)
6. [Default Login Credentials](#6-default-login-credentials)
7. [Custom Domains & Free SSL](#7-custom-domains--free-ssl)
8. [Render Free Tier Tips & Best Practices](#8-render-free-tier-tips--best-practices)

---

## 1. Architecture on Render

Render does not offer a native PHP runtime, so PHP applications are deployed via **Docker**. 

We have architected Smart School to run as a **single, unified Docker container**:
- **Apache 2.4 + PHP 8.3** serves both the frontend SPA and the backend REST API.
- All `/api/*` requests route through CodeIgniter 3.
- All frontend static assets (`/frontend/*`) and the SPA router (`index.html`) are served from the same host.
- **Benefits:**
  - **No CORS configuration needed** — frontend and backend share the exact same domain.
  - **Single Web Service** — fits entirely within Render's 750 free hours/month (runs 24/7).
  - **Dynamic Port Binding** — [`docker-entrypoint.sh`](file:///c:/Users/RUPAM/OneDrive/Desktop/Smart-School-Management-System/docker-entrypoint.sh) automatically adapts Apache to bind to Render's dynamic `$PORT` (typically port `10000`).

```
┌─────────────────────────────────────────────────────────────┐
│                 Render Web Service (Docker)                 │
│                 https://your-school.onrender.com            │
├──────────────────────────────┬──────────────────────────────┤
│  Frontend Requests           │  API Requests                │
│  GET /                       │  GET /api/students           │
│  GET /js/app.js              │  POST /api/auth/login        │
│  GET /css/style.css          │  POST /api/fees/collect      │
│  ▼                           │  ▼                           │
│  Apache DocumentRoot         │  backend_codeigniter/        │
│  (Vanilla JS SPA)            │  (REST JSON Controllers)     │
└──────────────────────────────┴───────────────┬──────────────┘
                                               │ PDO MySQL
                                               ▼
                                 ┌────────────────────────────┐
                                 │   Remote Cloud MySQL 8     │
                                 │  (Aiven / Clever / TiDB)   │
                                 │   56 Relational Tables     │
                                 └────────────────────────────┘
```

---

## 2. Database Provisioning (MySQL)

Render provides managed PostgreSQL, but **not managed MySQL**. Since Smart School requires MySQL 8.x, you need a free cloud MySQL database.

Choose one of these 100% free options (recommended: **Aiven** or **Clever Cloud**):

### Option A: Aiven for MySQL (Recommended — Free Tier)
1. Sign up for free at [aiven.io](https://aiven.io).
2. Click **Create Service** → Select **MySQL** → Select **Free Plan**.
3. Choose a cloud region close to your Render service (e.g., Singapore, Frankfurt, or Oregon).
4. After creation (takes ~1 minute), go to the **Overview** tab and copy your connection parameters:
   - **Host** (e.g. `mysql-xxxx.aivencloud.com`)
   - **Port** (e.g. `12345`)
   - **User** (e.g. `avnadmin`)
   - **Password** (e.g. `AVNS_XXXXXXXXXXXX`)
   - **Database** (default is `defaultdb`, or create `smart_school`)

### Option B: Clever Cloud (Free MySQL + Free phpMyAdmin)
1. Sign up for free at [clever-cloud.com](https://www.clever-cloud.com).
2. Click **Create** → **an add-on** → Select **MySQL** (Free "Personal" plan).
3. Clever Cloud immediately provides:
   - Host, Port, Database name, Username, Password.
   - A built-in **phpMyAdmin** web interface to manage and view your database with 1 click.

### Option C: TiDB Cloud (Serverless MySQL 8 Compatible — Free 5 GB)
1. Sign up at [tidbcloud.com](https://tidbcloud.com).
2. Create a free **Serverless Cluster**.
3. Copy the standard MySQL connection string.

---

## 3. Step-by-Step Deployment Instructions

### Step 1: Push your Code to GitHub

Make sure all files, including `Dockerfile`, `docker-entrypoint.sh`, `render.yaml`, and `migrate.php`, are committed and pushed to your GitHub repository:

```bash
git add .
git commit -m "Configure Docker, migration runner, and Render blueprint"
git push origin main
```

---

### Step 2: Deploy on Render

You can deploy using either **Option 1 (Blueprint)** or **Option 2 (Manual)**:

#### Option 1: One-Click Deploy via Render Blueprint (Recommended)
1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** (top right) → **Blueprint**.
3. Connect your GitHub repository.
4. Render will automatically detect [`render.yaml`](file:///c:/Users/RUPAM/OneDrive/Desktop/Smart-School-Management-System/render.yaml) and configure the web service with all required settings.
5. In the configuration screen, input your database environment variables (`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`).
6. Click **Apply**.

#### Option 2: Manual Web Service Setup
1. In your Render Dashboard, click **New +** → **Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name:** `smart-school` (or your preferred name)
   - **Region:** Same region as your database (e.g. Singapore, Oregon, Frankfurt)
   - **Language / Runtime:** Select **Docker**
   - **Branch:** `main`
   - **Plan:** Select **Free**
4. Scroll down to **Environment Variables** and add:

| Key | Recommended Value |
|---|---|
| `ENVIRONMENT` | `production` |
| `DB_HOST` | *Your remote MySQL host (e.g. mysql-xxxx.aivencloud.com)* |
| `DB_PORT` | `3306` *(or custom port from your provider)* |
| `DB_DATABASE` | `smart_school` *(or defaultdb)* |
| `DB_USERNAME` | *Your database username* |
| `DB_PASSWORD` | *Your database password* |
| `RAZORPAY_KEY_ID` | `rzp_test_XXXXXXXX` *(or leave blank for cash mode)* |
| `RAZORPAY_KEY_SECRET` | `XXXXXXXXXXXXXXXX` |
| `RAZORPAY_MODE` | `test` *(or `live`)* |
| `WHATSAPP_NUMBER` | `+919876543210` |
| `MIGRATION_SECRET` | `smart_school_init_2026` |

5. Click **Create Web Service**.

Render will now pull the code, build the Docker image, run the health check, and assign you a live HTTPS URL (e.g., `https://smart-school-xxxx.onrender.com`).

---

## 4. One-Click Database Migration & Seeding

Once your Render Web Service is running, your database needs the 56 tables and sample records. We have provided [`migrate.php`](file:///c:/Users/RUPAM/OneDrive/Desktop/Smart-School-Management-System/migrate.php) to do this instantly without needing MySQL installed on your computer.

Choose either method:

### Method A: Web Browser Execution (Easiest)
Simply open your browser and navigate to:
```
https://your-app-name.onrender.com/migrate.php?secret=smart_school_init_2026
```
*(Replace `your-app-name` with your actual Render URL, and `smart_school_init_2026` with your `MIGRATION_SECRET`).*

The script will connect to your remote MySQL server, execute the schema dump, create all 56 tables, insert initial roles and accounts, and print the completion summary:
```
========================================================================
 Execution Summary:
 Statements Executed : 142 / 142
 Warnings / Skipped  : 0
 Total Tables Created: 56 tables in database 'smart_school'
========================================================================
Database migration completed successfully!
```

### Method B: Render Web Shell
1. Go to your Render Dashboard → Click on your `smart-school` Web Service.
2. In the left menu, click **Shell**.
3. Type the following command and press Enter:
   ```bash
   php migrate.php
   ```
4. The migration will run inside the container and output the real-time progress.

---

## 5. Environment Variables Reference

| Variable | Required? | Default | Description |
|---|:---:|:---:|---|
| `PORT` | Auto | `10000` | Injected dynamically by Render. Handled automatically. |
| `ENVIRONMENT` | Yes | `production` | PHP environment (`production`, `development`, or `testing`). |
| `DB_HOST` | Yes | `127.0.0.1` | Remote MySQL server hostname or IP. |
| `DB_PORT` | Yes | `3306` | MySQL port (Aiven uses custom high ports like `12345`). |
| `DB_DATABASE` | Yes | `smart_school` | Name of the MySQL database. |
| `DB_USERNAME` | Yes | `root` | Database user with CREATE, INSERT, SELECT privileges. |
| `DB_PASSWORD` | Yes | `""` | Database user password. |
| `RAZORPAY_KEY_ID` | Optional | `""` | Razorpay Key ID for online fee payments. |
| `RAZORPAY_KEY_SECRET` | Optional | `""` | Razorpay Key Secret for payment signature verification. |
| `RAZORPAY_MODE` | Optional | `test` | `test` for Sandbox payments; `live` for real money. |
| `WHATSAPP_NUMBER` | Optional | `""` | WhatsApp Business sender phone number. |
| `MIGRATION_SECRET` | Yes | `smart_school_init_2026` | Token protecting the web migration runner. |

---

## 6. Default Login Credentials

After migration, you can log in immediately:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Super Admin** | `admin@smartschool.edu` | `Admin@123` | Full access to all 45 modules & settings |
| **Teacher** | `teacher@smartschool.edu` | `Teacher@123` | Academics, Marks Entry, Attendance, Timetable |
| **Accountant** | `accountant@smartschool.edu` | `Account@123` | Fee Collection, Ledger, Payroll, Razorpay |
| **Student** | `student@smartschool.edu` | `Student@123` | Student portal, Fee view, Marks, Admit cards |

---

## 7. Custom Domains & Free SSL

Render provides free automated TLS/SSL certificates (Let's Encrypt):
1. In your Render Dashboard, navigate to your service → **Settings** → **Custom Domains**.
2. Click **Add Custom Domain** (e.g. `school.yourinstitution.edu`).
3. Point your domain's DNS:
   - For a subdomain (e.g. `school.example.com`): Add a `CNAME` record pointing to your Render hostname (e.g. `smart-school-xxxx.onrender.com`).
   - For an apex domain (e.g. `example.com`): Add an `ALIAS` or `ANAME` record pointing to Render's IP.
4. Render will automatically issue and renew your HTTPS SSL certificate.

---

## 8. Render Free Tier Tips & Best Practices

1. **Free Instance Sleep Behavior:**
   - On Render's Free tier, services spin down after 15 minutes of zero web traffic.
   - When a user visits the URL, Render automatically wakes the container up (this cold start takes ~30 to 50 seconds).
   - Subsequent page views and API requests are instantaneous.
   - *Tip:* To prevent your service from sleeping during school hours, you can set up a free monitor at [UptimeRobot.com](https://uptimerobot.com) to ping your homepage every 10 minutes.

2. **Ephemeral Disk vs Database:**
   - Free Render containers have an ephemeral local filesystem. Any files written locally to disk are reset on container restart.
   - All student profiles, fees, exam marks, and records are safely stored in your remote MySQL database (Aiven/Clever Cloud), which is persistent and never reset.

3. **Multi-Tab Real-Time Sync:**
   - Smart School's built-in `BroadcastChannel` and localStorage sync automatically synchronizes fee collections, admissions, and attendance across multiple open browser windows without needing WebSocket servers.
