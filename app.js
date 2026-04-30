'use strict';

/**
 * app.js — Health Tracker core logic (CLEAN BASELINE)
 * ✅ Valid JavaScript (no HTML entities)
 * ✅ DOM-safe initialization
 * ✅ UI buttons guaranteed active
 * ✅ Table guaranteed built
 */

(function () {

  /* ==================== METRICS ==================== */
  const METRICS = [
    { key: 'glucose', label: 'Glucose (mg/dL)', type: 'number' },
    { key: 'sys', label: 'Systolic (mmHg)', type: 'number' },
    { key: 'dia', label: 'Diastolic (mmHg)', type: 'number' },
    { key: 'spo2', label: 'SpO₂ (%)', type: 'number' },
    { key: 'hr', label: 'Heart Rate (bpm)', type: 'number' },
    { key: 'weightLbs', label: 'Weight (lbs)', type: 'number' },
    { key: 'sleep', label: 'Sleep (hrs)', type: 'number' },
    { key: 'steps', label: 'Steps', type: 'number' },
    { key: 'pain', label: 'Pain (0–10)', type: 'number' },
    { key: 'symptoms', label: 'Symptoms (0–10)', type: 'number' },
    { key: 'emotions', label: 'Emotions', type: 'text' },
    { key: 'comments', label: 'Comments', type: 'text' }
  ];

  const DEFAULT_FIELDS_VISIBLE = [
    'date', 'time',
    'glucose', 'sys', 'dia', 'spo2', 'hr',
    'weightLbs', 'sleep', 'steps', 'pain', 'symptoms'
  ];

  /* ==================== STATE ==================== */
  const State = {
    entries: [],
    fieldsVisible: new Set(DEFAULT_FIELDS_VISIBLE),
    editId: null
  };

  /* ==================== UI ==================== */
  const UI = {

    buildTable() {
      const head = document.getElementById('tableHead');
      const body = document.getElementById('tableBody');
      if (!head || !body) return;

      // Header
      head.innerHTML = '';
      const tr = document.createElement('tr');
      ['date', 'time', ...METRICS.map(m => m.key)]
        .filter(k => State.fieldsVisible.has(k))
        .forEach(k => {
          const th = document.createElement('th');
          const m = METRICS.find(x => x.key === k);
          th.textContent = m ? m.label : (k === 'date' ? 'Date' : 'Time');
          tr.appendChild(th);
        });
      const thA = document.createElement('th');
      thA.textContent = 'Actions';
      tr.appendChild(thA);
      head.appendChild(tr);

      // Body
      body.innerHTML = '';
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

      State.entries.forEach(en => {
        const tr = document.createElement('tr');
        ['date', 'time', ...METRICS.map(m => m.key)]
          .filter(k => State.fieldsVisible.has(k))
          .forEach(k => {
            const td = document.createElement('td');
            td.textContent = en[k] ?? '';
            tr.appendChild(td);
          });

        const tdA = document.createElement('td');
        const btnE = document.createElement('button');
        btnE.className = 'btn';
        btnE.textContent = 'Edit';
        btnE.onclick = () => UI.openEntry(en.id);
        tdA.appendChild(btnE);
        tr.appendChild(tdA);

        body.appendChild(tr);
      });
    },

    openEntry(id = null) {
      State.editId = id;
      document.getElementById('entryModal')?.classList.add('show');
    },

    closeEntry() {
      document.getElementById('entryModal')?.classList.remove('show');
    },

    openFields() {
      document.getElementById('fieldsModal')?.classList.add('show');
    },

    closeFields() {
      document.getElementById('fieldsModal')?.classList.remove('show');
    },

    openThresholds() {
      document.getElementById('thModal')?.classList.add('show');
    },

    closeThresholds() {
      document.getElementById('thModal')?.classList.remove('show');
    },

    openOptions() {
      document.getElementById('optModal')?.classList.add('show');
    },

    closeOptions() {
      document.getElementById('optModal')?.classList.remove('show');
    }
  };

  /* ==================== ACTIONS ==================== */
  const Actions = {

    init() {
      // Baseline: no DB yet
      State.entries = [];
      UI.buildTable();
    }

  };

  /* ==================== EVENT WIRING ==================== */
  function bind() {
    document.getElementById('btnAdd')?.addEventListener('click', () => UI.openEntry());
    document.getElementById('btnFields')?.addEventListener('click', () => UI.openFields());
    document.getElementById('btnThresholds')?.addEventListener('click', () => UI.openThresholds());
    document.getElementById('btnOptions')?.addEventListener('click', () => UI.openOptions());

    document.getElementById('btnSaveEntry')?.addEventListener('click', () => UI.closeEntry());
    document.getElementById('btnSaveFields')?.addEventListener('click', () => UI.closeFields());
    document.getElementById('btnSaveThresholds')?.addEventListener('click', () => UI.closeThresholds());
    document.getElementById('btnSaveOptions')?.addEventListener('click', () => UI.closeOptions());

    // Backdrop close
    ['entryModal','fieldsModal','thModal','optModal'].forEach(id => {
      document.getElementById(id)?.addEventListener('click', e => {
        if (e.target.classList.contains('modal-backdrop')) {
          e.target.classList.remove('show');
        }
      });
    });
  }

  /* ==================== BOOT ==================== */
  window.addEventListener('DOMContentLoaded', () => {
    bind();
    Actions.init();
  });

  /* ==================== GLOBALS ==================== */
  window.UI = UI;
  window.Actions = Actions;

})();
