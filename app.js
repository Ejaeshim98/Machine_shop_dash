// ── DUMMY DATA ──────────────────────────────────────────────

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

function daysFromToday(n) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + n);
  return d;
}

const machines = [
  { id: 'M1', name: 'CNC-001', model: 'Haas VF-2',        status: 'running' },
  { id: 'M2', name: 'CNC-002', model: 'Haas VF-4',        status: 'setting-up' },
  { id: 'M3', name: 'LATHE-001', model: 'Mazak QT-Nexus', status: 'running' },
  { id: 'M4', name: 'LATHE-002', model: 'Mazak QT-250',   status: 'stopped' },
  { id: 'M5', name: 'EDM-001',  model: 'Sodick AG40L',    status: 'empty' },
];

const jobs = [
  // Quoting
  { id: 'J1004', dwg: 'DWG-2241', part: 'End Cap',           machine: 'M4', stage: 'quoting',    start: daysFromToday(-1), due: daysFromToday(7),  qty: 20, produced: 0  },
  { id: 'J1006', dwg: 'DWG-3302', part: 'Spindle Adapter',   machine: 'M1', stage: 'quoting',    start: daysFromToday(-2), due: daysFromToday(10), qty: 6,  produced: 0  },
  { id: 'J1009', dwg: 'DWG-4187', part: 'Coolant Manifold',  machine: 'M5', stage: 'quoting',    start: daysFromToday(0),  due: daysFromToday(14), qty: 5,  produced: 0  },
  // Setup
  { id: 'J1002', dwg: 'DWG-1095', part: 'Shaft Housing',     machine: 'M2', stage: 'setup',      start: daysFromToday(-3), due: daysFromToday(4),  qty: 4,  produced: 0  },
  { id: 'J1008', dwg: 'DWG-5563', part: 'Mounting Block',    machine: 'M3', stage: 'setup',      start: daysFromToday(-1), due: daysFromToday(6),  qty: 16, produced: 0  },
  { id: 'J1010', dwg: 'DWG-0874', part: 'Bearing Retainer',  machine: 'M4', stage: 'setup',      start: daysFromToday(-2), due: daysFromToday(9),  qty: 8,  produced: 0  },
  // In Progress
  { id: 'J1001', dwg: 'DWG-7741', part: 'Bracket Assy',      machine: 'M1', stage: 'inprogress', start: daysFromToday(-4), due: daysFromToday(5),  qty: 12, produced: 7  },
  { id: 'J1003', dwg: 'DWG-3390', part: 'Flange Plate',      machine: 'M3', stage: 'inprogress', start: daysFromToday(-3), due: daysFromToday(8),  qty: 8,  produced: 3  },
  { id: 'J1007', dwg: 'DWG-6612', part: 'Gear Housing',      machine: 'M2', stage: 'inprogress', start: daysFromToday(-5), due: daysFromToday(11), qty: 3,  produced: 1  },
  { id: 'J1011', dwg: 'DWG-2208', part: 'Tool Holder Block', machine: 'M5', stage: 'inprogress', start: daysFromToday(-2), due: daysFromToday(13), qty: 10, produced: 4  },
  // Finished
  { id: 'J1005', dwg: 'DWG-9921', part: 'Valve Body',        machine: 'M5', stage: 'finished',   start: daysFromToday(-8), due: daysFromToday(3),  qty: 2,  produced: 2  },
  { id: 'J1012', dwg: 'DWG-4450', part: 'Pulley Hub',        machine: 'M4', stage: 'finished',   start: daysFromToday(-6), due: daysFromToday(5),  qty: 7,  produced: 7  },
];

// ── HELPERS ─────────────────────────────────────────────────

function getMachine(id) { return machines.find(m => m.id === id); }

function duePriority(due) {
  const diff = Math.floor((due - TODAY) / 86400000);
  if (diff < 0)  return 'red';
  if (diff <= 1) return 'yellow';
  return 'green';
}

function fmtDate(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function dueLabel(due) {
  const diff = Math.floor((due - TODAY) / 86400000);
  if (diff < 0)  return `Overdue (${fmtDate(due)})`;
  if (diff === 0) return 'Due Today';
  if (diff === 1) return 'Due Tomorrow';
  return `Due ${fmtDate(due)}`;
}

function statusLabel(s) {
  return { running: 'Running', 'setting-up': 'Setting Up', stopped: 'Stopped', empty: 'Machine Empty' }[s] || s;
}

// ── AUTH & PERMISSIONS ───────────────────────────────────────

const USERS = [
  { username: 'admin',    password: 'admin123',    role: 'Admin',    display: 'Admin' },
  { username: 'manager',  password: 'manager123',  role: 'Manager',  display: 'Manager' },
  { username: 'operator', password: 'operator123', role: 'Operator', display: 'Operator' },
];

let currentUser = null;

const ROLE_PERMS = {
  Admin:    { createJob: true,  editJob: true,  deleteJob: true,  editMachine: true,  settings: true  },
  Manager:  { createJob: true,  editJob: true,  deleteJob: true,  editMachine: true,  settings: false },
  Operator: { createJob: false, editJob: false, deleteJob: false, editMachine: true,  settings: false },
};

function can(action) {
  if (!currentUser) return false;
  return ROLE_PERMS[currentUser.role]?.[action] ?? false;
}

function login(username, password) {
  const user = USERS.find(u => u.username === username && u.password === password);
  if (!user) return false;
  currentUser = user;
  sessionStorage.setItem('sfUser', JSON.stringify({ username: user.username, role: user.role, display: user.display }));
  applyAuth();
  return true;
}

function logout() {
  currentUser = null;
  sessionStorage.removeItem('sfUser');
  applyAuth();
}

function applyAuth() {
  const loggedIn = !!currentUser;
  document.getElementById('loginOverlay').style.display  = loggedIn ? 'none' : 'flex';
  document.getElementById('headerUser').style.display    = loggedIn ? 'flex' : 'none';

  if (loggedIn) {
    document.getElementById('headerUserName').textContent = currentUser.display;
    document.getElementById('headerUserRole').textContent = currentUser.role;
  }

  // Settings tab visibility
  const settingsTab = document.querySelector('.nav-tab[data-tab="settings"]');
  if (settingsTab) settingsTab.style.display = can('settings') ? '' : 'none';

  // + New Job button
  const newJobBtn = document.querySelector('.nav-actions .btn-add-job');
  if (newJobBtn) newJobBtn.style.display = can('createJob') ? '' : 'none';

  renderAll();
}

// Restore session on page load
(function restoreSession() {
  const saved = sessionStorage.getItem('sfUser');
  if (saved) {
    try {
      const u = JSON.parse(saved);
      currentUser = USERS.find(x => x.username === u.username) || null;
    } catch(e) { currentUser = null; }
  }
})();

// ── DARK MODE ───────────────────────────────────────────────

function applyTheme(dark) {
  document.body.classList.toggle('dark', dark);
  const toggle = document.getElementById('darkModeToggle');
  if (toggle) toggle.checked = dark;
  localStorage.setItem('darkMode', dark ? '1' : '0');
}

// Load saved preference on startup
applyTheme(localStorage.getItem('darkMode') === '1');

document.addEventListener('change', function(e) {
  if (e.target.id === 'darkModeToggle') applyTheme(e.target.checked);
}, true);

// ── CLOCK ───────────────────────────────────────────────────

function updateClock() {
  const now = new Date();
  document.getElementById('headerTime').textContent =
    now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  document.getElementById('headerDate').textContent =
    now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
setInterval(updateClock, 1000);
updateClock();

// ── STAT BAR ────────────────────────────────────────────────

function renderStats() {
  const active = jobs.filter(j => j.stage !== 'finished');
  document.getElementById('statTotal').textContent   = active.length;
  document.getElementById('statOnTime').textContent  = active.filter(j => duePriority(j.due) === 'green').length;
  document.getElementById('statDueSoon').textContent = active.filter(j => duePriority(j.due) === 'yellow').length;
  document.getElementById('statOverdue').textContent = active.filter(j => duePriority(j.due) === 'red').length;
  document.getElementById('statRunning').textContent = machines.filter(m => m.status === 'running').length;
}

// ── MACHINE GRID (overview) ─────────────────────────────────

function duebar(job) {
  if (!job) return '';
  const daysLeft = Math.floor((job.due - TODAY) / 86400000);
  const MAX_DAYS = 14;
  const pct = daysLeft <= 0 ? 100 : Math.min(100, Math.round((daysLeft / MAX_DAYS) * 100));
  const pri = duePriority(job.due);
  const label = daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`;
  return `
    <div class="machine-due-bar-wrap">
      <div class="machine-due-label">
        <span>Today</span><span>${label}</span>
      </div>
      <div class="machine-due-track">
        <div class="machine-due-fill ${pri}" style="width:${pct}%"></div>
      </div>
    </div>`;
}

function renderMachineGrid() {
  const el = document.getElementById('machineGrid');
  el.innerHTML = machines.map(m => {
    const job = jobs.find(j => j.machine === m.id && j.stage !== 'finished');
    return `
      <div class="machine-card ${m.status}">
        <div class="machine-name">${m.name}</div>
        <div class="machine-type">${m.model}</div>
        <span class="machine-status-badge badge-${m.status}">${statusLabel(m.status)}</span>
        <div class="machine-job">${job ? job.id + ' · ' + job.part : '—'}</div>
        ${duebar(job)}
      </div>`;
  }).join('');
}

// ── MACHINE DETAIL (machines tab) ───────────────────────────

function renderMachineDetail() {
  const el = document.getElementById('machineDetailGrid');
  el.innerHTML = machines.map(m => {
    const job = jobs.find(j => j.machine === m.id && j.stage !== 'finished');
    const pri = job ? duePriority(job.due) : null;
    return `
      <div class="machine-detail-card ${m.status}">
        <div class="mdc-header">
          <div>
            <div class="mdc-name">${m.name}</div>
            <div class="mdc-model">${m.model}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
            <span class="machine-status-badge badge-${m.status}">${statusLabel(m.status)}</span>
            <button class="btn-edit-machine" data-edit-machine="${m.id}">Edit</button>
          </div>
        </div>
        <div class="mdc-row"><span class="label">Active Job</span><span>${job ? job.id : '—'}</span></div>
        <div class="mdc-row"><span class="label">DWG #</span><span>${job ? (job.dwg || '—') : '—'}</span></div>
        <div class="mdc-row"><span class="label">Part</span><span>${job ? job.part : '—'}</span></div>
        <div class="mdc-row"><span class="label">Qty</span><span>${job ? job.qty : '—'}</span></div>
        <div class="mdc-row"><span class="label">Due</span>
          <span ${pri ? `style="color:var(--${pri})"` : ''}>${job ? dueLabel(job.due) : '—'}</span>
        </div>
        ${duebar(job)}
        <select class="status-select" data-machine="${m.id}">
          <option value="running"     ${m.status==='running'     ? 'selected':''}>Running</option>
          <option value="setting-up"  ${m.status==='setting-up'  ? 'selected':''}>Setting Up</option>
          <option value="stopped"     ${m.status==='stopped'     ? 'selected':''}>Stopped</option>
          <option value="empty"       ${m.status==='empty'       ? 'selected':''}>Machine Empty</option>
        </select>
      </div>`;
  }).join('');
}

function updateMachineStatus(select) {
  const m = machines.find(x => x.id === select.dataset.machine);
  if (m) { m.status = select.value; renderAll(); }
}

// ── KANBAN (mini overview) ───────────────────────────────────

const STAGES = [
  { key: 'quoting',    label: 'Quoting' },
  { key: 'setup',      label: 'Setup' },
  { key: 'inprogress', label: 'In Progress' },
  { key: 'finished',   label: 'Finished' },
];

function renderKanbanMini() {
  const el = document.getElementById('kanbanMini');
  el.innerHTML = STAGES.map(s => {
    const cards = jobs.filter(j => j.stage === s.key);
    return `
      <div class="kanban-mini-col">
        <div class="kanban-mini-col-title">${s.label} (${cards.length})</div>
        ${cards.map(j => {
          const pri = duePriority(j.due);
          return `
            <div class="kanban-mini-card">
              <div class="mini-card-job">${j.id}</div>
              <div class="mini-card-machine">${getMachine(j.machine)?.name ?? '—'}</div>
              <div class="mini-card-due ${pri}">${fmtDate(j.due)}</div>
            </div>`;
        }).join('')}
      </div>`;
  }).join('');
}

// ── KANBAN (full board) ──────────────────────────────────────

let dragJobId = null;

function renderKanbanBoard() {
  const el = document.getElementById('kanbanBoard');
  el.innerHTML = STAGES.map(s => {
    const cards = jobs.filter(j => j.stage === s.key);
    return `
      <div class="kanban-col col-${s.key}"
           data-stage="${s.key}">
        <div class="kanban-col-header">
          <span class="kanban-col-title">${s.label}</span>
          <span class="kanban-col-count">${cards.length}</span>
        </div>
        <div class="kanban-cards">
          ${cards.map(j => {
            const m = getMachine(j.machine);
            const pri = duePriority(j.due);
            return `
              <div class="kanban-card"
                   draggable="true"
                   data-job="${j.id}">
                <div class="kc-top">
                  <span class="kc-job">${j.id}</span>
                  <span class="kc-machine">${m?.name ?? '—'}</span>
                </div>
                <div class="kc-part">${j.part}</div>
                <div class="kc-dwg">DWG: ${j.dwg || '—'}</div>
                <div class="kc-footer">
                  <span class="kc-due ${pri}">${dueLabel(j.due)}</span>
                  <span class="kc-qty">Qty: ${j.qty}</span>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>`;
  }).join('');
}

// ── CALENDAR ────────────────────────────────────────────────

let calYear  = TODAY.getFullYear();
let calMonth = TODAY.getMonth();
let calView  = 'month'; // 'month' | 'week'
let calWeekStart = new Date(TODAY); // start of displayed week

function calDayCell(cellDate) {
  const isToday   = cellDate.getTime() === TODAY.getTime();
  const dayJobs   = jobs.filter(j => {
    const jd = new Date(j.due); jd.setHours(0,0,0,0);
    return jd.getTime() === cellDate.getTime();
  });
  const chips = dayJobs.map(j => {
    const pri = duePriority(j.due);
    return `<span class="cal-job-chip chip-${pri}" data-cal-job="${j.id}">${j.id} · ${getMachine(j.machine)?.name ?? '—'}</span>`;
  }).join('');
  const label = cellDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `
    <div class="cal-cell ${isToday ? 'today' : ''} ${dayJobs.length === 0 ? 'cal-empty' : ''}">
      <div class="cal-day-num">${calView === 'week' ? label : cellDate.getDate()}</div>
      ${chips}
    </div>`;
}

function renderCalendar() {
  const el = document.getElementById('calendarContainer');

  let titleText = '';
  let cells = '';

  if (calView === 'month') {
    const firstDay = new Date(calYear, calMonth, 1);
    const lastDay  = new Date(calYear, calMonth + 1, 0);
    titleText = firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    for (let i = 0; i < firstDay.getDay(); i++) cells += `<div class="cal-cell other-month"></div>`;
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const cellDate = new Date(calYear, calMonth, d);
      cellDate.setHours(0,0,0,0);
      cells += calDayCell(cellDate);
    }
  } else {
    // week view — 7 days from calWeekStart
    const ws = new Date(calWeekStart); ws.setHours(0,0,0,0);
    const we = new Date(ws); we.setDate(we.getDate() + 6);
    titleText = `${ws.toLocaleDateString('en-US',{month:'short',day:'numeric'})} — ${we.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`;
    for (let i = 0; i < 7; i++) {
      const cellDate = new Date(ws); cellDate.setDate(ws.getDate() + i);
      cells += calDayCell(cellDate);
    }
  }

  el.innerHTML = `
    <div class="cal-nav">
      <button id="calPrevBtn">&#8249;</button>
      <span class="cal-nav-title">${titleText}</span>
      <button id="calNextBtn">&#8250;</button>
      <div class="cal-toggle">
        <button class="cal-toggle-btn ${calView==='month'?'active':''}" id="calMonthBtn">Month</button>
        <button class="cal-toggle-btn ${calView==='week'?'active':''}" id="calWeekBtn">Week</button>
      </div>
    </div>
    <div class="cal-grid">
      <div class="cal-day-name">Sun</div><div class="cal-day-name">Mon</div>
      <div class="cal-day-name">Tue</div><div class="cal-day-name">Wed</div>
      <div class="cal-day-name">Thu</div><div class="cal-day-name">Fri</div>
      <div class="cal-day-name">Sat</div>
      ${cells}
    </div>`;
}

// ── NAV TABS ────────────────────────────────────────────────

function switchTab(name) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + name));
}

// ── NOTIFICATIONS ────────────────────────────────────────────

const alerts = [];
let notifOpen = false;

function addAlert(type, message) {
  const exists = alerts.some(a => a.message === message);
  if (exists) return;
  alerts.unshift({ type, message, time: new Date() });
  if (alerts.length > 30) alerts.pop();
  renderNotifBadge();
}

function renderNotifBadge() {
  const badge = document.getElementById('notifBadge');
  if (!badge) return;
  if (alerts.length > 0) {
    badge.style.display = 'flex';
    badge.textContent = alerts.length > 99 ? '99+' : alerts.length;
  } else {
    badge.style.display = 'none';
  }
}

function renderNotifPanel() {
  const list = document.getElementById('notifList');
  if (!list) return;
  if (alerts.length === 0) {
    list.innerHTML = '<div class="notif-empty">No alerts — everything looks good.</div>';
    return;
  }
  list.innerHTML = alerts.map(a => {
    const mins = Math.floor((new Date() - a.time) / 60000);
    const timeLabel = mins < 1 ? 'Just now' : mins < 60 ? `${mins}m ago` : `${Math.floor(mins/60)}h ago`;
    return `
      <div class="notif-item">
        <div class="notif-dot ${a.type}"></div>
        <div>
          <div class="notif-msg">${a.message}</div>
          <div class="notif-time">${timeLabel}</div>
        </div>
      </div>`;
  }).join('');
}

function checkAlerts() {
  jobs.forEach(j => {
    if (j.stage === 'finished') return;
    const diff = Math.floor((j.due - TODAY) / 86400000);
    if (diff < 0)   addAlert('red',    `${j.id} — ${j.part} is overdue by ${Math.abs(diff)} day(s)`);
    else if (diff === 0) addAlert('yellow', `${j.id} — ${j.part} is due today`);
    else if (diff === 1) addAlert('yellow', `${j.id} — ${j.part} is due tomorrow`);
  });
  machines.forEach(m => {
    if (m.status === 'stopped') addAlert('red', `${m.name} is currently stopped`);
    if (m.status === 'empty')   addAlert('blue', `${m.name} is empty — ready for a new job`);
  });
}

// ── PART COUNTER SIMULATOR ───────────────────────────────────

let simInterval = null;

function updateSimUI() {
  const running = !!simInterval;
  const dot   = document.getElementById('simStateDot');
  const label = document.getElementById('simStateLabel');
  const badge = document.getElementById('simStatusBadge');
  const start = document.getElementById('btnStartSim');
  const stop  = document.getElementById('btnStopSim');
  if (dot)   { dot.className   = 'sim-state-dot'   + (running ? ' running' : ''); }
  if (label) { label.className = 'sim-state-label'  + (running ? ' running' : ''); label.textContent = running ? 'Running' : 'Stopped'; }
  if (badge) { badge.textContent = running ? 'Running' : 'Stopped'; badge.className = 'api-status-badge ' + (running ? 'api-badge-live' : 'api-badge-sim'); }
  if (start) start.disabled = running;
  if (stop)  stop.disabled  = !running;
}

function renderApiCounters() {
  const el = document.getElementById('apiCounterGrid');
  if (!el) return;
  const running = !!simInterval;
  el.innerHTML = machines.map(m => {
    const job = jobs.find(j => j.machine === m.id && j.stage === 'inprogress');
    const isLive = running && m.status === 'running' && job;
    return `
      <div class="api-counter-card ${isLive ? 'live' : ''}">
        <div class="api-counter-name">${m.name}</div>
        <div class="api-counter-val">${job ? (job.produced ?? 0) : '—'}</div>
        <div class="api-counter-label ${isLive ? 'live' : ''}">${isLive ? '● Live' : job ? 'Paused' : 'No active job'}</div>
      </div>`;
  }).join('');
}

function startSimulator() {
  if (simInterval) return;
  simInterval = setInterval(() => {
    machines.forEach(m => {
      if (m.status !== 'running') return;
      const job = jobs.find(j => j.machine === m.id && j.stage === 'inprogress');
      if (!job || job.produced >= job.qty) return;
      job.produced++;
      if (!job._milestones) job._milestones = new Set();
      const pct = Math.floor((job.produced / job.qty) * 100);
      for (const milestone of [50, 75, 90, 100]) {
        if (pct >= milestone && !job._milestones.has(milestone)) {
          job._milestones.add(milestone);
          const msg = milestone === 100
            ? `${m.name} — ${job.id} complete! All ${job.qty} parts produced`
            : `${m.name} — ${job.id} is ${milestone}% complete (${job.produced} / ${job.qty} parts)`;
          addAlert(milestone === 100 ? 'yellow' : 'blue', msg);
        }
      }
    });
    renderApiCounters();
    renderStats();
    renderNotifBadge();
  }, 3000);
  addAlert('blue', 'Part counter simulator started');
  updateSimUI();
  renderApiCounters();
  renderNotifBadge();
}

function stopSimulator() {
  if (simInterval) { clearInterval(simInterval); simInterval = null; }
  addAlert('blue', 'Part counter simulator stopped');
  updateSimUI();
  renderApiCounters();
  renderNotifBadge();
}

// ── EXCEL INTEGRATION ────────────────────────────────────────

function exportExcel() {
  const wb = XLSX.utils.book_new();

  // Jobs sheet
  const jobRows = jobs.map(j => ({
    'Job #':           j.id,
    'DWG #':           j.dwg || '',
    'Part Name':       j.part,
    'Machine ID':      j.machine,
    'Machine Name':    getMachine(j.machine)?.name ?? '',
    'Stage':           STAGES.find(s => s.key === j.stage)?.label ?? j.stage,
    'Start Date':      j.start ? j.start.toLocaleDateString('en-US') : '',
    'Due Date':        j.due.toLocaleDateString('en-US'),
    'Qty Ordered':     j.qty,
    'Parts Produced':  j.produced ?? 0,
  }));
  const wsJobs = XLSX.utils.json_to_sheet(jobRows);
  wsJobs['!cols'] = [10,12,20,12,14,14,12,12,12,14].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, wsJobs, 'Jobs');

  // Machines sheet
  const machineRows = machines.map(m => ({
    'Machine ID':   m.id,
    'Name':         m.name,
    'Model':        m.model,
    'Status':       statusLabel(m.status),
  }));
  const wsMachines = XLSX.utils.json_to_sheet(machineRows);
  wsMachines['!cols'] = [12,12,18,16].map(w => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, wsMachines, 'Machines');

  const date = new Date().toLocaleDateString('en-US').replace(/\//g, '-');
  XLSX.writeFile(wb, `ShopFloor_Export_${date}.xlsx`);
}

function importExcel(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const wb = XLSX.read(e.target.result, { type: 'array', cellDates: true });

      // Parse Jobs sheet
      const wsJobs = wb.Sheets['Jobs'];
      if (!wsJobs) { alert('Could not find a "Jobs" sheet in the file.'); return; }
      const jobRows = XLSX.utils.sheet_to_json(wsJobs);

      // Parse Machines sheet
      const wsMachines = wb.Sheets['Machines'];
      if (!wsMachines) { alert('Could not find a "Machines" sheet in the file.'); return; }
      const machineRows = XLSX.utils.sheet_to_json(wsMachines);

      // Rebuild machines array
      machines.length = 0;
      machineRows.forEach(r => {
        const statusKey = Object.keys({ running: 'Running', 'setting-up': 'Setting Up', stopped: 'Stopped', empty: 'Machine Empty' })
          .find(k => statusLabel(k) === r['Status']) || 'empty';
        machines.push({
          id:     String(r['Machine ID'] || '').trim(),
          name:   String(r['Name'] || '').trim(),
          model:  String(r['Model'] || '').trim(),
          status: statusKey,
        });
      });

      // Rebuild jobs array
      const stageKeyMap = {};
      STAGES.forEach(s => { stageKeyMap[s.label.toLowerCase()] = s.key; });

      jobs.length = 0;
      jobRows.forEach(r => {
        const dueRaw   = r['Due Date'];
        const startRaw = r['Start Date'];
        const due   = dueRaw   ? new Date(dueRaw)   : new Date();
        const start = startRaw ? new Date(startRaw) : null;
        due.setHours(0,0,0,0);
        if (start) start.setHours(0,0,0,0);

        const stageRaw = String(r['Stage'] || '').toLowerCase();
        const stage = stageKeyMap[stageRaw] || 'quoting';

        jobs.push({
          id:       String(r['Job #'] || '').trim(),
          dwg:      String(r['DWG #'] || '').trim(),
          part:     String(r['Part Name'] || '').trim(),
          machine:  String(r['Machine ID'] || '').trim(),
          stage,
          start,
          due,
          qty:      parseInt(r['Qty Ordered']) || 1,
          produced: parseInt(r['Parts Produced']) || 0,
        });
      });

      renderAll();
      alert('Import successful — dashboard updated.');
    } catch(err) {
      alert('Import failed. Please check the file format and try again.\n\n' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

// ── JOB DETAIL MODAL ─────────────────────────────────────────

let detailJobId = null;

function openJobDetail(jobId) {
  const j = jobs.find(x => x.id === jobId);
  if (!j) return;
  detailJobId = jobId;
  const m    = getMachine(j.machine);
  const pri  = duePriority(j.due);
  const daysLeft = Math.floor((j.due - TODAY) / 86400000);
  const daysLeftLabel = daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft} days remaining`;
  const stageLabel = STAGES.find(s => s.key === j.stage)?.label ?? j.stage;
  const pct  = j.qty > 0 ? Math.min(100, Math.round((j.produced / j.qty) * 100)) : 0;

  document.getElementById('detailJobId').textContent = `${j.id} — ${j.part}`;
  document.getElementById('detailBody').innerHTML = `
    <div class="mdc-row"><span class="label">DWG #</span><span>${j.dwg || '—'}</span></div>
    <div class="mdc-row"><span class="label">Part Name</span><span>${j.part}</span></div>
    <div class="mdc-row"><span class="label">Machine</span><span>${m?.name ?? '—'} (${m?.model ?? '—'})</span></div>
    <div class="mdc-row"><span class="label">Stage</span><span>${stageLabel}</span></div>
    <div class="mdc-row"><span class="label">Start Date</span><span>${j.start ? fmtDate(j.start) : '—'}</span></div>
    <div class="mdc-row"><span class="label">Due Date</span><span style="color:var(--${pri})">${fmtDate(j.due)} · ${daysLeftLabel}</span></div>
    <div class="mdc-row"><span class="label">Qty Ordered</span><span>${j.qty}</span></div>
    <div class="mdc-row" style="border-bottom:none"><span class="label">Parts Produced</span><span>${j.produced} / ${j.qty}</span></div>
    <div style="margin-top:10px">
      <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-dim);margin-bottom:4px">
        <span>Progress</span><span>${pct}%</span>
      </div>
      <div style="background:var(--surface2);border-radius:4px;height:8px;overflow:hidden">
        <div style="width:${pct}%;height:100%;border-radius:4px;background:var(--${pri})"></div>
      </div>
    </div>`;
  document.getElementById('jobDetailModal').classList.add('open');
}

function closeJobDetail() {
  document.getElementById('jobDetailModal').classList.remove('open');
  detailJobId = null;
}

// ── SETTINGS — MACHINE MANAGEMENT ───────────────────────────

function renderMachineSettings() {
  const el = document.getElementById('machineSettingsGrid');
  if (!el) return;
  el.innerHTML = machines.map(m => {
    const jobCount = jobs.filter(j => j.machine === m.id && j.stage !== 'finished').length;
    return `
      <div class="machine-detail-card ${m.status}" style="cursor:pointer" data-edit-machine="${m.id}">
        <div class="mdc-header">
          <div>
            <div class="mdc-name">${m.name}</div>
            <div class="mdc-model">${m.model}</div>
          </div>
          <span class="machine-status-badge badge-${m.status}">${statusLabel(m.status)}</span>
        </div>
        <div class="mdc-row"><span class="label">Active Jobs</span><span>${jobCount}</span></div>
      </div>`;
  }).join('');
}

let editingMachineId = null;

function nextMachineId() {
  const nums = machines.map(m => parseInt(m.id.replace('M', ''))).filter(n => !isNaN(n));
  return 'M' + (Math.max(0, ...nums) + 1);
}

function openMachineModal(machineId) {
  editingMachineId = machineId || null;
  const isEdit = !!machineId;
  document.getElementById('machineModalTitle').textContent = isEdit ? 'Edit Machine' : 'New Machine';
  document.getElementById('machineModalDelete').style.display = isEdit ? 'inline-block' : 'none';
  if (isEdit) {
    const m = machines.find(x => x.id === machineId);
    document.getElementById('fMachineName').value   = m.name;
    document.getElementById('fMachineModel').value  = m.model;
    document.getElementById('fMachineStatus').value = m.status;
  } else {
    document.getElementById('fMachineName').value   = '';
    document.getElementById('fMachineModel').value  = '';
    document.getElementById('fMachineStatus').value = 'empty';
  }
  document.getElementById('machineModal').classList.add('open');
}

function closeMachineModal() {
  document.getElementById('machineModal').classList.remove('open');
  editingMachineId = null;
}

function saveMachine() {
  const name   = document.getElementById('fMachineName').value.trim();
  const model  = document.getElementById('fMachineModel').value.trim();
  const status = document.getElementById('fMachineStatus').value;
  if (!name)  { alert('Please enter a machine name.'); return; }
  if (!model) { alert('Please enter a model.'); return; }
  if (editingMachineId) {
    const m = machines.find(x => x.id === editingMachineId);
    m.name = name; m.model = model; m.status = status;
  } else {
    machines.push({ id: nextMachineId(), name, model, status });
  }
  closeMachineModal();
  renderAll();
}

function deleteMachine() {
  if (!editingMachineId) return;
  const activeJobs = jobs.filter(j => j.machine === editingMachineId && j.stage !== 'finished');
  if (activeJobs.length > 0) {
    alert(`Cannot delete — this machine has ${activeJobs.length} active job(s). Reassign them first.`);
    return;
  }
  if (!confirm('Delete this machine? This cannot be undone.')) return;
  const idx = machines.findIndex(m => m.id === editingMachineId);
  if (idx !== -1) machines.splice(idx, 1);
  closeMachineModal();
  renderAll();
}

// ── MODAL ────────────────────────────────────────────────────

let editingJobId = null;

function nextJobId() {
  const nums = jobs.map(j => parseInt(j.id.replace('J', ''))).filter(n => !isNaN(n));
  return 'J' + (Math.max(0, ...nums) + 1);
}

function openModal(jobId) {
  editingJobId = jobId || null;
  const modal = document.getElementById('jobModal');
  const isEdit = !!jobId;

  document.getElementById('modalTitle').textContent = isEdit ? 'Edit Job' : 'New Job';
  document.getElementById('modalDelete').style.display = (isEdit && can('deleteJob')) ? 'inline-block' : 'none';

  // Populate machine dropdown
  const fMachine = document.getElementById('fMachine');
  fMachine.innerHTML = machines.map(m => `<option value="${m.id}">${m.name} — ${m.model}</option>`).join('');

  if (isEdit) {
    const j = jobs.find(x => x.id === jobId);
    document.getElementById('fJobId').value   = j.id;
    document.getElementById('fDwg').value     = j.dwg || '';
    document.getElementById('fPart').value    = j.part;
    fMachine.value                             = j.machine;
    document.getElementById('fStart').value   = j.start ? j.start.toISOString().split('T')[0] : '';
    document.getElementById('fDue').value     = j.due.toISOString().split('T')[0];
    document.getElementById('fQty').value     = j.qty;
    document.getElementById('fProduced').value = j.produced ?? 0;
    document.getElementById('fStage').value   = j.stage;
  } else {
    document.getElementById('fJobId').value   = nextJobId();
    document.getElementById('fDwg').value     = '';
    document.getElementById('fPart').value    = '';
    fMachine.value                             = machines[0]?.id || '';
    document.getElementById('fStart').value   = '';
    document.getElementById('fDue').value     = '';
    document.getElementById('fQty').value     = '';
    document.getElementById('fProduced').value = 0;
    document.getElementById('fStage').value   = 'quoting';
  }

  modal.classList.add('open');
}

function closeModal() {
  document.getElementById('jobModal').classList.remove('open');
  editingJobId = null;
}

function saveJob() {
  const dwg      = document.getElementById('fDwg').value.trim();
  const part     = document.getElementById('fPart').value.trim();
  const machine  = document.getElementById('fMachine').value;
  const startVal = document.getElementById('fStart').value;
  const dueVal   = document.getElementById('fDue').value;
  const qty      = parseInt(document.getElementById('fQty').value) || 1;
  const produced = parseInt(document.getElementById('fProduced').value) || 0;
  const stage    = document.getElementById('fStage').value;

  if (!part)   { alert('Please enter a part name.'); return; }
  if (!dueVal) { alert('Please select a due date.'); return; }

  const due   = new Date(dueVal + 'T00:00:00');
  const start = startVal ? new Date(startVal + 'T00:00:00') : null;

  if (editingJobId) {
    const j = jobs.find(x => x.id === editingJobId);
    const oldMachine = j.machine;
    j.dwg = dwg; j.part = part; j.machine = machine; j.start = start; j.due = due; j.qty = qty; j.produced = produced; j.stage = stage;
    // if reassigned, clear old machine if it has no other active jobs
    if (oldMachine !== machine) {
      const stillActive = jobs.some(x => x.id !== editingJobId && x.machine === oldMachine && x.stage !== 'finished');
      if (!stillActive) {
        const m = machines.find(x => x.id === oldMachine);
        if (m) m.status = 'empty';
      }
    }
    // auto-empty machine when job is marked finished
    if (stage === 'finished') {
      const otherActive = jobs.some(x => x.id !== editingJobId && x.machine === machine && x.stage !== 'finished');
      if (!otherActive) {
        const m = machines.find(x => x.id === machine);
        if (m) m.status = 'empty';
      }
    }
  } else {
    jobs.push({ id: nextJobId(), dwg, part, machine, start, due, qty, produced, stage });
  }

  closeModal();
  renderAll();
}

function deleteJob() {
  if (!editingJobId) return;
  if (!confirm('Delete this job? This cannot be undone.')) return;
  const idx = jobs.findIndex(j => j.id === editingJobId);
  if (idx !== -1) jobs.splice(idx, 1);
  closeModal();
  renderAll();
}

// ── DELEGATED EVENTS (one listener on document handles everything) ──

document.addEventListener('click', function(e) {
  const target = e.target;

  // Nav tabs
  const tab = target.closest('.nav-tab');
  if (tab) { switchTab(tab.dataset.tab); return; }

  // "View Full" link
  const panelLink = target.closest('.panel-link');
  if (panelLink) { switchTab('kanban'); return; }

  // Calendar prev/next
  if (target.id === 'calPrevBtn') {
    if (calView === 'month') { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } }
    else { calWeekStart.setDate(calWeekStart.getDate() - 7); }
    renderCalendar(); return;
  }
  if (target.id === 'calNextBtn') {
    if (calView === 'month') { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } }
    else { calWeekStart.setDate(calWeekStart.getDate() + 7); }
    renderCalendar(); return;
  }

  // Calendar view toggle
  if (target.id === 'calMonthBtn') { calView = 'month'; renderCalendar(); return; }
  if (target.id === 'calWeekBtn')  { calView = 'week';  calWeekStart = new Date(TODAY); renderCalendar(); return; }

  // Calendar job chip click
  const chip = target.closest('[data-cal-job]');
  if (chip) { openJobDetail(chip.dataset.calJob); return; }

  // Job detail modal controls
  if (target.id === 'detailClose' || target.id === 'detailCloseBtn' || target.id === 'jobDetailModal') { closeJobDetail(); return; }
  if (target.id === 'detailEdit') { closeJobDetail(); openModal(detailJobId); return; }

  // Login
  if (target.id === 'btnLogin') {
    const u = document.getElementById('loginUsername').value.trim();
    const p = document.getElementById('loginPassword').value;
    const err = document.getElementById('loginError');
    if (!login(u, p)) { err.style.display = 'block'; } else { err.style.display = 'none'; }
    return;
  }

  // Logout
  if (target.id === 'btnLogout') { logout(); return; }

  // Add job button
  if (target.closest('.btn-add-job') && target.id !== 'btnAddMachine') {
    if (!can('createJob')) return;
    openModal(); return;
  }

  // Add machine button
  if (target.id === 'btnAddMachine') { openMachineModal(); return; }

  // Export Excel
  if (target.id === 'btnExportExcel') { exportExcel(); return; }

  // Import Excel — trigger file picker
  if (target.id === 'btnImportExcel') {
    document.getElementById('excelFileInput').click(); return;
  }

  // Simulator popout open
  if (target.id === 'btnOpenSim') {
    const pop = document.getElementById('simPopout');
    pop.style.display = 'block';
    updateSimUI();
    renderApiCounters();
    return;
  }
  // Simulator close
  if (target.id === 'btnCloseSim') {
    document.getElementById('simPopout').style.display = 'none'; return;
  }
  // Simulator start/stop
  if (target.id === 'btnStartSim') { startSimulator(); return; }
  if (target.id === 'btnStopSim')  { stopSimulator();  return; }

  // Notification bell
  if (target.closest('#notifBell')) {
    notifOpen = !notifOpen;
    const panel = document.getElementById('notifPanel');
    panel.style.display = notifOpen ? 'flex' : 'none';
    if (notifOpen) renderNotifPanel();
    return;
  }

  // Clear all notifications
  if (target.id === 'notifClear') {
    alerts.length = 0;
    renderNotifBadge();
    renderNotifPanel();
    return;
  }

  // Close notif panel when clicking outside
  if (notifOpen && !target.closest('#notifPanel') && !target.closest('#notifBell')) {
    notifOpen = false;
    document.getElementById('notifPanel').style.display = 'none';
  }

  // Edit machine card
  const editMachineCard = target.closest('[data-edit-machine]');
  if (editMachineCard) {
    if (can('editMachine')) openMachineModal(editMachineCard.dataset.editMachine);
    return;
  }

  // Machine modal controls
  if (target.id === 'machineModalClose' || target.id === 'machineModalCancel') { closeMachineModal(); return; }
  if (target.id === 'machineModalSave')   { saveMachine(); return; }
  if (target.id === 'machineModalDelete') { deleteMachine(); return; }
  if (target.id === 'machineModal')       { closeMachineModal(); return; }

  // Click kanban card to edit (but not when dragging)
  const card = target.closest('.kanban-card');
  if (card && !card.classList.contains('dragging')) {
    if (can('editJob')) openModal(card.dataset.job);
    return;
  }

  // Modal controls
  if (target.id === 'modalClose' || target.id === 'modalCancel') { closeModal(); return; }
  if (target.id === 'modalSave')   { saveJob(); return; }
  if (target.id === 'modalDelete') { deleteJob(); return; }

  // Click outside modal to close
  if (target.id === 'jobModal') { closeModal(); return; }
});

document.addEventListener('change', function(e) {
  // Machine status dropdown
  const sel = e.target.closest('.status-select');
  if (sel) {
    const m = machines.find(x => x.id === sel.dataset.machine);
    if (m) { m.status = sel.value; renderAll(); }
    return;
  }

  // Excel file import
  if (e.target.id === 'excelFileInput') {
    const file = e.target.files[0];
    if (!file) return;
    const confirmed = confirm('Are you sure you want to replace all data? This will overwrite all current job and machine data with the contents of the selected file.');
    if (!confirmed) { e.target.value = ''; return; }
    importExcel(file);
    e.target.value = ''; // reset so same file can be re-imported
  }
});

// Drag and drop
document.addEventListener('dragstart', function(e) {
  const card = e.target.closest('.kanban-card');
  if (card) { dragJobId = card.dataset.job; card.classList.add('dragging'); }
});

document.addEventListener('dragend', function(e) {
  const card = e.target.closest('.kanban-card');
  if (card) card.classList.remove('dragging');
});

document.addEventListener('dragover', function(e) {
  const col = e.target.closest('.kanban-col');
  if (col) { e.preventDefault(); col.classList.add('drag-over'); }
});

document.addEventListener('dragleave', function(e) {
  const col = e.target.closest('.kanban-col');
  if (col && !col.contains(e.relatedTarget)) col.classList.remove('drag-over');
});

document.addEventListener('drop', function(e) {
  const col = e.target.closest('.kanban-col');
  if (!col) return;
  e.preventDefault();
  col.classList.remove('drag-over');
  const job = jobs.find(j => j.id === dragJobId);
  if (job && job.stage !== col.dataset.stage) {
    job.stage = col.dataset.stage;
    if (col.dataset.stage === 'finished') {
      const otherActive = jobs.some(x => x.id !== job.id && x.machine === job.machine && x.stage !== 'finished');
      if (!otherActive) {
        const m = machines.find(x => x.id === job.machine);
        if (m) m.status = 'empty';
      }
    }
    renderAll();
  }
  dragJobId = null;
});

// ── RENDER ALL ───────────────────────────────────────────────

function renderAll() {
  renderStats();
  renderMachineGrid();
  renderKanbanMini();
  renderKanbanBoard();
  renderMachineDetail();
  renderCalendar();
  renderApiCounters();
  checkAlerts();
  renderNotifBadge();
}

// Enter key on login fields
document.getElementById('loginUsername').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('loginPassword').focus(); });
document.getElementById('loginPassword').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('btnLogin').click(); });

applyAuth();
renderAll();
