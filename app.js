'use strict';

/* =============================================================================
   Health Tracker — app.js (RECODED, STABLE)
   ============================================================================= */

/* -----------------------------------------------------------------------------
   Utilities
----------------------------------------------------------------------------- */
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelector(sel);
const $$$ = sel => Array.from(document.querySelectorAll(sel));

const Util = {
  isoDate(d) {
    if (!d) return null;
    const dt = (d instanceof Date) ? d : new Date(d);
    return isNaN(dt) ? null : dt.toISOString().slice(0, 10);
  },
  fmt(n, dp = 0) {
    return (n == null || isNaN(n)) ? '—' : Number(n).toFixed(dp);
  },
  inRange(date, start, end) {
    if (!date) return false;
    const d = new Date(`${date}T00:00`);
    if (start && d < new Date(`${start}T00:00`)) return false;
    if (end && d > new Date(`${end}T23:59`)) return false;
    return true;
  }
};

/* -----------------------------------------------------------------------------
   Constants
----------------------------------------------------------------------------- */
const METRICS = [
  { key: 'glucose', label: 'Glucose (mg/dL)' },
  { key: 'sys', label: 'Systolic' },
  { key: 'dia', label: 'Diastolic' },
  { key: 'spo2', label: 'SpO₂ (%)' },
  { key: 'hr', label: 'Heart Rate' },
  { key: 'weightLbs', label: 'Weight (lbs)' },
  { key: 'sleep', label: 'Sleep (hrs)' },
  { key: 'pain', label: 'Pain' },
  { key: 'symptoms', label: 'Symptoms' }
];

const DEFAULT_FIELDS = [
  'date', 'time',
  'glucose', 'sys', 'dia', 'spo2', 'hr',
  'weightLbs', 'sleep', 'pain', 'symptoms'
];

/* -----------------------------------------------------------------------------
   State
----------------------------------------------------------------------------- */
const State = {
  entries: [],
  fieldsVisible: new Set(DEFAULT_FIELDS),
  thresholds: {},
  chart: null,
  ui: {
    view: 'both',
    chartEnabled: true
  }
};

/* -----------------------------------------------------------------------------
   IndexedDB
----------------------------------------------------------------------------- */
const DB = {
  db: null,

  async open() {
    if (!('indexedDB' in window)) return;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('health-tracker-db', 1);

      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('entries')) {
          db.createObjectStore('entries', {
            keyPath: 'id',
            autoIncrement: true
          });
        }
      };

      req.onsuccess = () => {
        DB.db = req.result;
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  },

  async all() {
    if (!DB.db) return [];
    return new Promise(res => {
      const tx = DB.db.transaction('entries', 'readonly');
      const req = tx.objectStore('entries').getAll();
      req.onsuccess = () => res(req.result || []);
    });
  },

  async put(entry) {
    if (!DB.db) return;
    return new Promise(res => {
      const tx = DB.db.transaction('entries', 'readwrite');
      tx.objectStore('entries').put(entry);
      tx.oncomplete = () => res();
    });
  },

  async del(id) {
    if (!DB.db) return;
    return new Promise(res => {
      const tx = DB.db.transaction('entries', 'readwrite');
      tx.objectStore('entries').delete(id);
      tx.oncomplete = () => res();
    });
  }
};

/* -----------------------------------------------------------------------------
   Table Rendering (ALWAYS EXISTS)
----------------------------------------------------------------------------- */
function renderTable() {
  const head = $('tableHead');
  const body = $('tableBody');

  head.innerHTML = '';
  body.innerHTML = '';

  const trH = document.createElement('tr');

  [...State.fieldsVisible].forEach(f => {
    const th = document.createElement('th');
    th.textContent = f === 'date' ? 'Date'
      : f === 'time' ? 'Time'
      : (METRICS.find(m => m.key === f)?.label || f);
    trH.appendChild(th);
  });
  trH.appendChild(document.createElement('th')).textContent = 'Actions';
  head.appendChild(trH);

  const start = $('filterStart')?.value;
  const end = $('filterEnd')?.value;

  State.entries
    .filter(e => Util.inRange(e.date, start, end))
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
    .forEach(e => {
      const tr = document.createElement('tr');

      [...State.fieldsVisible].forEach(f => {
        const td = document.createElement('td');
        td.textContent = e[f] ?? '';
        tr.appendChild(td);
      });

      const actions = document.createElement('td');
      const del = document.createElement('button');
      del.className = 'btn danger';
      del.textContent = 'Delete';
      del.onclick = async () => {
        await DB.del(e.id);
        await refresh();
      };

      actions.appendChild(del);
      tr.appendChild(actions);
      body.appendChild(tr);
    });
}

/* -----------------------------------------------------------------------------
   Chart.js (DATE‑ONLY X‑AXIS)
----------------------------------------------------------------------------- */
function renderChart() {
  if (!State.ui.chartEnabled) return;

  if (State.chart) {
    State.chart.destroy();
    State.chart = null;
  }

  const ctx = $('metricsChart')?.getContext('2d');
  if (!ctx) return;

  const metrics = [...$('chartMetrics').selectedOptions].map(o => o.value);
  if (!metrics.length) return;

  const rows = State.entries.slice().sort((a, b) => a.date.localeCompare(b.date));
  const labels = rows.map(r => r.date); // ✅ DATE ONLY

  const colors = ['#60a5fa', '#34d399', '#f59e0b', '#f472b6'];

  const datasets = metrics.map((m, i) => ({
    label: METRICS.find(x => x.key === m)?.label || m,
    data: rows.map(r => r[m] ?? null),
    borderColor: colors[i % colors.length],
    tension: .25,
    spanGaps: true
  }));

  State.chart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'category',           // ✅ no time adapter
          title: { display: true, text: 'Date' }
        }
      },
      plugins: {
        legend: { labels: { color: '#0a1220' } }
      }
    }
  });
}

/* -----------------------------------------------------------------------------
   Refresh All
----------------------------------------------------------------------------- */
async function refresh() {
  State.entries = await DB.all();
  renderTable();
  renderChart();
}

/* -----------------------------------------------------------------------------
   Button Wiring (data-action)
----------------------------------------------------------------------------- */
function wireActions() {
  document.body.addEventListener('click', async e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    switch (btn.dataset.action) {
      case 'refresh':
        await refresh();
        break;

      case 'add-entry':
        $('entryModal')?.classList.add('show');
        break;

      case 'open-fields':
        $('fieldsModal')?.classList.add('show');
        break;

      case 'open-thresholds':
        $('thModal')?.classList.add('show');
        break;

      case 'open-options':
        $('optModal')?.classList.add('show');
        break;

      case 'export-csv':
        alert('CSV export handled in next step');
        break;

      case 'export-pdf':
        alert('PDF export handled in next step');
        break;
    }
  });
}

/* -----------------------------------------------------------------------------
   Init
----------------------------------------------------------------------------- */
window.addEventListener('load', async () => {
  await DB.open();

  // Seed metric selector
  const cm = $('chartMetrics');
  METRICS.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.key;
    opt.textContent = m.label;
    opt.selected = ['glucose', 'sys', 'dia', 'spo2', 'hr'].includes(m.key);
    cm.appendChild(opt);
  });

