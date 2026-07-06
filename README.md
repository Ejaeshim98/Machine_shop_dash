# Shop Floor Dashboard

A browser-based desktop dashboard for CNC machine shop management. Tracks jobs, machine status, and due dates in one view. Data ties to an Excel spreadsheet for export and audit purposes.

---

## Current Status
**Segments 1–9 complete. Next: Segment 10 — Local Data Persistence**

### What's working now
- Login screen with three demo accounts (admin/admin123, manager/manager123, operator/operator123)
- Role-based access: Admins and Managers can create/edit/delete jobs; Operators can only update machine status
- Session persists on page refresh; logout clears the session

---

## Completed

### Segment 1 — Dashboard Shell ✅
- Header with live clock and date (sticky on scroll)
- 4 navigation tabs: Overview, Job Board, Machines, Calendar (sticky on scroll)
- Stat bar: Total Jobs, On Time, Due Soon, Overdue, Machines Running
- Overview tab with machine status grid + mini job board summary
- Job Board tab: swim-lane Kanban (Quoting → Setup → In Progress → Finished), drag-and-drop between lanes
- Machines tab: detailed machine cards with status dropdown (Running, Setting Up, Stopped, Machine Empty)
- Calendar tab: monthly view, job chips color-coded by due date urgency, prev/next navigation
- Due date progress bar on each machine card (Today → Due Date, green/yellow/red)
- 5 dummy machines, 12 dummy jobs loaded for testing
- Color coding: green = on time, yellow = due within 1 day, red = overdue

---

## Roadmap

### Segment 2 — Job Creation & Editing ✅
- Add new job form (Job #, Part Name, Machine, Due Date, Quantity, Stage)
- Edit existing job details by clicking a card
- Delete a job
- Jobs reflect immediately across all modules (Kanban, Machines, Calendar, stats)

### Segment 3 — Machine Management ✅
- Add / remove machines
- Assign and reassign jobs to machines
- Machine empty state triggers when job moves to Finished
- Machine history (what jobs ran on each machine)

### Segment 4 — Calendar Polish ✅
- Full due date calendar with stacked job chips
- Click a job chip to open job detail
- Visual week/month toggle

### Segment 5 — Excel Integration ✅
- Connect dashboard to an Excel file as the data source
- Read job and machine data from Excel on load
- Write changes back to Excel in real time
- Export snapshot button for audit purposes

### Segment 6 — UI/UX Design Pass ✅
- Full visual redesign: colors, typography, spacing, branding
- Dark/light mode toggle
- Polished kanban cards, machine cards, and stat bar

### Segment 7 — API Integrations ✅
- Excel export via SheetJS
- Part drawing and work order file attachments (PDF/JPG/PNG) per job
- In-app file preview panel with zoom, print, and save-as

### Segment 8 — User Permissions ✅
- Login screen with three demo accounts (admin/admin123, manager/manager123, operator/operator123)
- Role-based access: Admins and Managers can create/edit/delete jobs and machines; Operators can update machine status only
- Session persists on page refresh; logout clears the session
- Invalid username/password error message on failed login

---

## Desktop Application Roadmap

Goal: package the dashboard as a native Windows/Mac desktop app.

### Segment 9 — Electron Wrapper ✅
- Wrapped the web app in Electron — runs as a native Windows desktop app
- `Launch Dashboard.bat` for quick dev launch via `npm start`
- `npm run build` produces `dist\win-unpacked\Shop Floor Dashboard.exe` — standalone, no browser required

### Segment 10 — Local Data Persistence
Save all jobs and machine data to a local file (SQLite or JSON) so data survives between sessions. Replaces dummy data with real persistent storage.

### Segment 11 — Auto-Updater
App checks GitHub for new versions and updates itself silently — no manual reinstall needed.

### Segment 12 — Backend Server
Adds a small server to enable: real MTConnect machine polling, email/SMS alerts, and multi-computer access so the whole shop sees the same live data.

### Segment 13 — Installer & Distribution
Signed Windows installer (`.exe`) ready for deployment across all shop floor machines.

---

## Tech Stack
- **Frontend:** HTML, CSS, vanilla JavaScript (no frameworks, runs as a local file)
- **Data:** Excel (.xlsx) via SheetJS library (Segment 5)
- **Hosting:** Local file or simple web server — no backend required

---

## Files
| File | Purpose |
|------|---------|
| `index.html` | Main dashboard layout |
| `styles.css` | All styling |
| `app.js` | Data, logic, rendering |
| `main.js` | Electron entry point |
| `package.json` | Node/Electron config and build settings |
| `Launch Dashboard.bat` | Double-click to launch the app in dev mode |
| `README.md` | This file — progress tracker and roadmap |
