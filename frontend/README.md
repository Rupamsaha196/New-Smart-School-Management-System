# Smart School Management System — Frontend

Clean and modern **HTML5 / CSS3 / JavaScript** frontend for the Smart School Management System.

## Architecture Highlights
- **Zero Build Step Required**: Works directly with any web browser, VS Code **"Go Live"** (Live Server), or any static HTTP web server.
- **Pure Web Standards**: HTML5 semantic markup, CSS3 design tokens (Light/Dark themes, Glassmorphism, Micro-animations), and modern JavaScript.
- **Client-Side Routing**: Fast, responsive hash-based SPA router (`#/dashboard`, `#/students`, `#/attendance/qr`, etc.).
- **Full Backend API Integration**: Connects seamlessly with the CodeIgniter / PHP REST API at `http://localhost:8000/api`.

## Quick Start

### Option 1: VS Code Live Server (Recommended)
1. Open this `frontend` directory (or workspace root) in VS Code.
2. Right-click `index.html` and select **"Open with Live Server"** (or click **"Go Live"** in the bottom status bar).
3. The application will launch in your browser at `http://127.0.0.1:5500/index.html`.

### Option 2: Python HTTP Server
```bash
python -m http.server 5500
```
Open `http://localhost:5500` in your browser.

### Option 3: Direct Browser Open
Simply double-click or open `index.html` in any modern web browser (Chrome, Edge, Firefox, Safari).

## Directory Structure
```
frontend/
├── index.html                 # Main HTML application entrypoint
├── css/
│   └── style.css              # CSS design system, themes & responsive layout
├── js/
│   ├── app.js                 # API client, Auth, Toast, Layout, Dashboard & Router
│   ├── views-students.js      # Student Profile, TC Generator, Behavior Records
│   ├── views-academics.js     # Classes, Subjects, Sessions, Timetable, Calendar, Downloads, Live Classes
│   ├── views-attendance.js    # Manual Roll Call & Monthly Attendance Reports
│   ├── views-exams.js         # Exams Schedule, Marks Recording & Hall Ticket Admit Cards
│   ├── views-finance.js       # Fee Structure & Income/Expense Financial Ledger
│   ├── views-staff.js         # Staff Directory & Biometric Attendance
│   ├── views-operations.js    # Library, Transport, Hostel, Notice Board
│   └── views-settings.js      # Settings, Custom Fields, Two-Factor Auth (2FA)
└── assets/                    # Favicon, branding images & icons
```
