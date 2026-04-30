'use strict';  Health Tracker – Stable Core app.js
  ✅ IndexedDB
  ✅ Table creation
  ✅ Chart.js integration (date-only x-axis)
  ✅ Threshold editor
  ✅ Button wiring
  ✅ Global UI / Actions
*/

(() => {

  /* ============================================================
     UTILITIES
     ============================================================ */
  const $ = id => document.getElementById(id);

  const todayISO = () => new Date().toISOString().slice(0, 10);

  /* ============================================================
     METRICS
     ============================================================ */
  const METRICS = [
    { key: 'glucose', label: 'Glucose (mg/dL)' },
    { key: 'sys', label: 'Systolic (mmHg)' },
    { key: 'dia', label: 'Diastolic (mmHg)' },
    { key: 'spo2', label: 'SpO₂ (%)' },
    { key: 'hr', label: 'Heart Rate (bpm)' },
    { key: 'weightLbs', label: 'Weight (lbs)' },
    { key: 'sleep', label: 'Sleep (hrs)' },
    { key: 'steps', label: 'Steps' },
    { key: 'pain', label: 'Pain (0–10)' },
    { key: 'symptoms', label: 'Symptoms (0–10)' },
    { key: 'comments', label: 'Comments' }
  ];

  const DEFAULT_FIELDS = [
    'date', 'time',
    'glucose', 'sys', 'dia', 'spo2', 'hr',
    'weightLbs', 'sleep', 'steps', 'pain', 'symptoms'
  ];

  /* ============================================================
     STATE
     ============================================================ */
  const State = {
    entries: [],
    fieldsVisible: new Set(DEFAULT_FIELDS),
    editId: null,
    thresholds: {
      glucose: { low: 70, high: 180 },
      sys: { low: 90, high: 140 },
      dia: { low: 60, high: 90 },
      spo2: { low: 92, high: 100 },
      hr: { low: 45, high: 120 }
    }
  };

  /* ============================================================
     INDEXED DB
     ============================================================ */
  const DB = {
    db: null,

    open() {
      return new Promise((resolve, reject) => {
        const req = indexedDB.open('health-tracker-db', 1);

        req.onupgradeneeded = e => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('entries')) {
            db.createObjectStore('entries', { keyPath: 'id', autoIncrement: true });
          }
        };

        req.onsuccess = () => {
          DB.db = req.result;
          resolve();
        };
        req.onerror = () => reject(req.error);
      });
    },

    getAll() {
      return new Promise(resolve => {
        const tx = DB.db.transaction('entries', 'readonly');
        const req = tx.objectStore('entries').getAll();
        req.onsuccess = () => resolve(req.result || []);
      });
    },

    save(entry) {
      return new Promise(resolve => {
        const tx = DB.db.transaction('entries', 'readwrite');
        tx.objectStore('entries').put(entry);
        tx.oncomplete = resolve;
      });
    },

    delete(id) {
      return new Promise(resolve => {
        const tx = DB.db.transaction('entries', 'readwrite');
        tx.objectStore('entries').delete(id);
        tx.oncomplete = resolve;
      });
    }
  };

  /* ============================================================
     UI
     ============================================================ */
  const UI = {
    chart: null,

    /* ---------- TABLE ---------- */
    buildTable() {
      const head = $('tableHead');
      const body = $('tableBody');
      if (!head || !body) return;

      head.innerHTML = '';
      body.innerHTML = '';

      const tr = document.createElement('tr');
      [...State.fieldsVisible].forEach(k => {
        const th = document.createElement('th');
        th.textContent =
          k === 'date' ? 'Date' :
          k === 'time' ? 'Time' :
          (METRICS.find(m => m.key === k)?.label || k);
        tr.appendChild(th);
      });

      const thA = document.createElement('th');
      thA.textContent = 'Actions';
      tr.appendChild(thA);
      head.appendChild(tr);

      if (!State.entries.length) {
        const tr0 = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = tr.children.length;
        td.textContent = 'No entries yet';
        td.className = 'small';
        tr0.appendChild(td);
        body.appendChild(tr0);
        return;
      }

      State.entries.forEach(e => {
        const tr = document.createElement('tr');
        [...State.fieldsVisible].forEach(k => {
          const td = document.createElement('td');
          td.textContent = e[k] ?? '';
          tr.appendChild(td);
        });

        const tdA = document.createElement('td');
        const btnE = document.createElement('button');
        btnE.className = 'btn';
        btnE.textContent = 'Edit';
        btnE.onclick = () => UI.openEntry(e.id);

        const btnD = document.createElement('button');
        btnD.className = 'btn danger';
        btnD.textContent = 'Delete';
        btnD.onclick = async () => {
          await DB.delete(e.id);
          Actions.refresh();
        };

        tdA.append(btnE, btnD);
        tr.appendChild(tdA);
        body.appendChild(tr);
      });
    },

    /* ---------- MODALS ---------- */
    openEntry(id = null) {
      State.editId = id;
      $('entryModal')?.classList.add('show');
      $('f_date').value = todayISO();
      $('f_time').value = new Date().toTimeString().slice(0,5);
    },
    closeEntry() { $('entryModal')?.classList.remove('show'); },

    openFields() { $('fieldsModal')?.classList.add('show'); },
    closeFields() { $('fieldsModal')?.classList.remove('show'); },

    openThresholds() {
      $('thModal')?.classList.add('show');
      const host = $('thEditor');
      if (!host) return;
      host.innerHTML = '';

      Object.keys(State.thresholds).forEach(k => {
        const t = State.thresholds[k];
        host.insertAdjacentHTML('beforeend', `
          <div class="card">
            <h2>${k.toUpperCase()}</h2>
            <div class="row">
              <div><label>Low</label><input id="th_${k}_low" type="number" value="${t.low}"></div>
              <div><label>High</label><input id="th_${k}_high" type="number" value="${t.high}"></div>
            </div>
          </div>
        `);
      });
    },
    closeThresholds() { $('thModal')?.classList.remove('show'); },

    openOptions() { $('optModal')?.classList.add('show'); },
    closeOptions() { $('optModal')?.classList.remove('show'); },

    /* ---------- CHART ---------- */
    refreshChart() {
      if (!window.Chart) return;
      const canvas = $('metricsChart');
      if (!canvas) return;

      if (UI.chart) UI.chart.destroy();

      const labels = State.entries.map(e => e.date);
      const datasets = ['glucose','sys','dia','spo2','hr']
        .map((k,i) => ({
          label: k,
          data: State.entries.map(e => e[k] ?? null),
          borderColor: ['#60a5fa','#34d399','#f87171','#a78bfa','#f59e0b'][i],
          tension: 0.25
        }));

      UI.chart = new Chart(canvas, {
        type: 'line',
        data: { labels, datasets },
        options: {
          responsive: true,
          plugins: { legend: { display: true } },
          scales: {
            x: { ticks: { callback: v => labels[v] } }
          }
        }
      });
    }
  };

  /* ============================================================
     ACTIONS
     ============================================================ */
  const Actions = {
    async init() {
      await DB.open();
      State.entries = await DB.getAll();
      UI.buildTable();
      UI.refreshChart();
    },

    async refresh() {
      State.entries = await DB.getAll();
      UI.buildTable();
      UI.refreshChart();
    },

    async saveEntry() {
      const entry = {
        id: State.editId ?? undefined,
        date: $('f_date').value,
        time: $('f_time').value,
        glucose: Number($('f_glucose')?.value || null)
      };
      await DB.save(entry);
      UI.closeEntry();
      Actions.refresh();
    },

    saveThresholds() {
      Object.keys(State.thresholds).forEach(k => {
        State.thresholds[k].low = Number($(`th_${k}_low`).value);
        State.thresholds[k].high = Number($(`th_${k}_high`).value);
      });
      UI.closeThresholds();
    }
  };

  /* ============================================================
     WIRING
     ============================================================ */
  function bind() {
    $('btnAdd')?.addEventListener('click', () => UI.openEntry());
    $('btnFields')?.addEventListener('click', UI.openFields);
    $('btnThresholds')?.addEventListener('click', UI.openThresholds);
    $('btnOptions')?.addEventListener('click', UI.openOptions);

    $('btnSaveEntry')?.addEventListener('click', Actions.saveEntry);
    $('btnSaveThresholds')?.addEventListener('click', Actions.saveThresholds);
  }

  window.addEventListener('DOMContentLoaded', () => {
    bind();
    Actions.init();
  });

  window.UI = UI;
  window.Actions = Actions;

})();
``

/*
