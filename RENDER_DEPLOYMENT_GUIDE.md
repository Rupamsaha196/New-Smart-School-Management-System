# Smart School – Render Cloud Deployment Guide
### Infosof Technologies 2026 | Enterprise School Management System

This guide outlines how to deploy the **Smart School Management System** to **[Render](https://render.com/)** in minutes using **Docker** and cloud MySQL.

---

## 📑 Table of Contents

1. [Architecture & Compatibility](#1-architecture--compatibility)
2. [Method 1: 1-Click Render Blueprint Deployment (Recommended)](#2-method-1-1-click-render-blueprint-deployment-recommended)
3. [Method 2: Manual Web Service Deployment](#3-method-2-manual-web-service-deployment)
4. [Setting Up a Free Cloud MySQL Database](#4-setting-up-a-free-cloud-mysql-database)
5. [Database Auto-Migration & Seeding](#5-database-auto-migration--seeding)
6. [Default Login Credentials](#6-default-login-credentials)
7. [Free-Tier Keep-Alive Configuration (24/7 Uptime)](#7-free-tier-keep-alive-configuration-247-uptime)
8. [Troubleshooting & FAQ](#8-troubleshooting--faq)

---

## 1. Architecture & Compatibility

- **Runtime:** Docker (`php:8.2-apache` Debian Bookworm container).
- **Backend:** CodeIgniter 3.x / PHP 8.x with PDO MySQL, SQLite fallback, RESTful controllers.
- **Frontend:** Standard browser-native HTML5 / CSS3 / JavaScript (zero build step, instant load).
- **Port Handling:** Dynamic binding to Render's `$PORT` environment variable (defaults to 10000).
- **Health Check Endpoint:** `/health` (returns JSON status `{"status":"healthy", ...}`).
- **Security:** Mod-rewrite blocking sensitive files (`.env`, `database/`, `.git`), SSL/TLS transport.

---

## 2. Method 1: 1-Click Render Blueprint Deployment (Recommended)

The repository includes a ready-to-use [`render.yaml`](render.yaml) blueprint specification.

### Step-by-Step:
1. Push your code to your GitHub repository:
   ```bash
   git push origin main
   ```
2. Log into the **[Render Dashboard](https://dashboard.render.com/)**.
3. In the top navigation bar, click **New +** and select **Blueprint**.
4. Connect your GitHub repository (`New-Smart-School-Management-System`).
5. Render will automatically parse [`render.yaml`](render.yaml) and configure:
   - Service Name: `smart-school-management-system`
   - Runtime: `Docker`
   - Plan: `Free`
   - Health Check Path: `/health`
6. Fill in your MySQL Database credentials in the prompted environment variables:
   - `DB_HOST`
   - `DB_PORT` (Default: `3306` or `4000` for TiDB)
   - `DB_DATABASE`
   - `DB_USERNAME`
   - `DB_PASSWORD`
   - `DB_SSL` (`true`)
7. Click **Apply**. Render will build the Docker container and deploy the app!

---

## 3. Method 2: Manual Web Service Deployment

If you prefer configuring the Web Service manually via the Render UI:

### Step-by-Step:
1. In the **Render Dashboard**, click **New +** -> **Web Service**.
2. Select **Build and deploy from a Git repository** and connect your repository.
3. Configure the following service settings:
   - **Name:** `smart-school-management-system` (or your preferred name)
   - **Region:** Choose closest to your users (e.g. `Oregon (US West)`, `Frankfurt (EU)`, `Singapore (Asia)`)
   - **Branch:** `main`
   - **Runtime:** `Docker`
   - **Dockerfile Path:** `./Dockerfile`
   - **Instance Type:** `Free` (or `Starter`)
4. Expand **Advanced** and set:
   - **Health Check Path:** `/health`
   - **Auto-Deploy:** `Yes`
5. Under **Environment Variables**, add:

| Variable Key | Suggested Value | Description |
| :--- | :--- | :--- |
| `CI_ENV` | `production` | CodeIgniter environment mode |
| `APP_URL` | `https://your-service.onrender.com` | Your live Render application URL |
| `DB_HOST` | `gateway01.us-east-1.prod.aws.tidbcloud.com` | Cloud MySQL hostname |
| `DB_PORT` | `4000` | Port (`3306` standard, `4000` for TiDB) |
| `DB_DATABASE` | `smart_school` | Database name |
| `DB_USERNAME` | `your_user` | Database username |
| `DB_PASSWORD` | `your_password` | Database password |
| `DB_SSL` | `true` | Enables TLS transport for cloud MySQL |
| `AUTO_MIGRATE` | `true` | Auto-runs schema migration on container boot |
| `MIGRATION_SECRET` | `smart_school_init_2026` | Security secret for browser migration runner |
| `RAZORPAY_ENABLED` | `0` | Set `1` when online payments are configured |

6. Click **Create Web Service**.

---

## 4. Setting Up a Free Cloud MySQL Database

Render offers managed PostgreSQL for free, but does not provide managed MySQL. We recommend using **TiDB Cloud Serverless** (free forever, 5 GB storage, MySQL 8.0 wire-compatible) or **Aiven MySQL**.

### Option A: TiDB Cloud Serverless (Recommended – 100% Free Forever)
1. Sign up for free at **[https://tidbcloud.com](https://tidbcloud.com)** (no credit card required).
2. Click **Create Cluster** -> Choose **Serverless (Free)**.
3. Once created, click **Connect**:
   - Choose connection method: **General**
   - Click **Generate Password** and copy your credentials.
4. Copy the parameters into your Render environment variables:
   - `DB_HOST`: Host from TiDB connect modal (e.g. `gateway01.us-east-1.prod.aws.tidbcloud.com`)
   - `DB_PORT`: `4000`
   - `DB_DATABASE`: `test` (or create database `smart_school`)
   - `DB_USERNAME`: (ends with `.root`)
   - `DB_PASSWORD`: (your generated password)
   - `DB_SSL`: `true`

### Option B: Aiven Free MySQL
1. Sign up at **[https://aiven.io](https://aiven.io)**.
2. Create a new **MySQL** service on the free tier.
3. Copy the host, port, user, and password into Render. Set `DB_SSL=true`.

### Option C: Clever Cloud MySQL
1. Sign up at **[https://www.clever-cloud.com](https://www.clever-cloud.com)**.
2. Create an **Add-on** -> **MySQL** (choose the free trial / dev plan).
3. Copy the `MYSQL_URL` directly into Render's `MYSQL_URL` environment variable!

---

## 5. Database Auto-Migration & Seeding

The application includes an automated migration and seed runner in [`migrate.php`](migrate.php).

### Automatic Migration:
If `AUTO_MIGRATE=true` is set in your Render environment variables, the container's [`docker-entrypoint.sh`](docker-entrypoint.sh) will automatically run [`migrate.php`](migrate.php) upon container start.

### Manual Web Migration Runner:
You can also initialize or re-seed the database at any time directly through your web browser:

```
https://your-service-name.onrender.com/migrate.php?secret=smart_school_init_2026
```
*(Replace `smart_school_init_2026` with your custom `MIGRATION_SECRET` if changed in Render)*

The migration runner will:
- Establish an encrypted TLS/SSL connection with your MySQL cluster.
- Create the tables and constraints from `smart_school_infosof_2026.sql`.
- Seed initial users, academic sessions, default settings, and sample data.
- Return a detailed execution summary in plain text.

---

## 6. Default Login Credentials

After migration is complete, log into Smart School using any of the seeded accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@smartschool.edu` | `Admin@123` |
| **Teacher** | `teacher@smartschool.edu` | `Teacher@123` |
| **Accountant** | `accountant@smartschool.edu` | `Account@123` |

> [!NOTE]
> For security, change default passwords after your first login via **Settings -> Users & Roles**.

---

## 7. Free-Tier Keep-Alive & Auto-Waker System (No UptimeRobot Required)

Render's free web services automatically spin down ("sleep") after **15 minutes of inactivity**.

The project now includes **3 built-in solutions** to stay awake and auto-start without third-party services like UptimeRobot:

### Method A: Client-Side Auto-Keep-Alive & Wake-Up Engine (Built-In Browser JS)
- **Automatic Heartbeat:** When any user has the web app open, `frontend/js/keepalive.js` sends an unthrottled Web Worker heartbeat every **8 minutes** to `/health`.
- **Background Tab Safe:** Uses an inline Web Worker so browser timers are never throttled or frozen when tabs are minimized.
- **Cold-Start Auto-Waker & Auto-Retry:** If the service is already sleeping when visited, a modern floating overlay appears: *"⚡ Cloud Server Starting Up..."*. It polls `/health` every 3.5s and automatically completes pending API requests as soon as Render spins up (~30s), requiring zero page refreshes from the user.
- **Multi-Tab Sync:** Uses `localStorage` and `BroadcastChannel` so multiple tabs coordinate and only 1 tab pings.

### Method B: Free GitHub Actions 24/7 Keep-Alive Workflow (Zero Maintenance)
A ready-to-use GitHub Actions workflow is included at [`.github/workflows/render-keepalive.yml`](.github/workflows/render-keepalive.yml):
1. In your GitHub repository, go to **Settings > Secrets and variables > Actions**.
2. Add a Repository Secret:
   - `RENDER_APP_URL`: `https://your-service-name.onrender.com`
3. GitHub will automatically ping your `/health` endpoint every **10 minutes** for free 24/7, keeping it permanently awake even when no browser tabs are open!

### Method C: Standalone Node.js Runner (`keepalive-runner.js`)
Run locally or on any server/VPS:
```bash
node keepalive-runner.js https://your-service-name.onrender.com 10
```

---

## 8. Troubleshooting & FAQ

### Q1: Render says "Port scan timeout: No open ports found on 0.0.0.0"
- **Cause:** Web server is not listening on the port Render assigned.
- **Fix:** Our [`docker-entrypoint.sh`](docker-entrypoint.sh) automatically replaces Apache's listening port with `$PORT` (default `10000`). If configuring manually, make sure your service has the default port `10000`.

### Q2: Health Check fails with 404
- **Cause:** Apache rewrite or path routing issue.
- **Fix:** Both `/health` and `/api/health` are routed directly to [`index.php`](index.php) in [`.htaccess`](.htaccess), returning HTTP 200 with JSON status. Ensure your health check path is set to `/health`.

### Q3: Database connection fails with "SSL: certificate verify failed"
- **Cause:** Cloud databases require CA bundle verification.
- **Fix:** The container has Debian system CA certificates installed (`ca-certificates`). [`migrate.php`](migrate.php) and [`DB.php`](backend_codeigniter/system/database/DB.php) automatically detect `/etc/ssl/certs/ca-certificates.crt`. Make sure `DB_SSL=true` is set.

### Q4: Can I test the Docker image locally before deploying to Render?
- **Yes!** Run:
  ```bash
  docker compose up -d --build
  ```
  Then visit `http://localhost:10000` in your browser.
