// ====================== HEALTH TRACKER - chart.js ======================

let entries = [];
let chartInstance = null;
let currentEditIndex = -1;

const showToast = (msg) => {
  const toast = document.getElementById('updateToast');
  if (toast) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
  }
};

window.UI = {
  closeEntry: () => document.getElementById('entryModal').classList.remove('show'),
  closeFields: () => document.getElementById('fieldsModal').classList.remove('show'),
  closeBulkRemove: () => document.getElementById('bulkRemoveModal').classList.remove('show'),
  closeThresholds: () => document.getElementById('thModal').classList.remove('show'),
  closeOptions: () => document.getElementById('optModal').classList.remove('show')
};

// Render Table
function renderTable() {
  const tbody = document.getElementById('tableBody');
  if (!tbody) return;
  tbody.innerHTML = entries.map((e, i) => `
    <tr>
      <td>${e.date || '—'}</td>
      <td>${e.glucose || '—'}</td>
      <td>${e.sys || '—'}/${e.dia || '—'}</td>
      <td>${e.weightLbs || '—'}</td>
      <td>
        <button class="btn" onclick="editEntry(${i})">Edit</button>
        <button class="btn danger" onclick="deleteEntry(${i})">Delete</button>
      </td>
    </tr>
  `).join('');
}

window.editEntry = function(i) {
  currentEditIndex = i;
  const e = entries[i];
  document.getElementById('entryModalTitle').textContent = 'Edit Entry';
  document.getElementById('f_date').value = e.date || '';
  document.getElementById('f_glucose').value = e.glucose || '';
  document.getElementById('f_sys').value = e.sys || '';
  document.getElementById('f_dia').value = e.dia || '';
  document.getElementById('f_weightLbs').value = e.weightLbs || '';
  document.getElementById('entryModal').classList.add('show');
};

window.deleteEntry = function(i) {
  if (confirm('Delete this entry?')) {
    entries.splice(i, 1);
    renderTable();
    showToast('Entry deleted');
  }
};

// Save Entry
document.getElementById('btnSaveEntry').addEventListener('click', () => {
  const entry = {
    date: document.getElementById('f_date').value,
    glucose: parseFloat(document.getElementById('f_glucose').value),
    sys: parseFloat(document.getElementById('f_sys').value),
    dia: parseFloat(document.getElementById('f_dia').value),
    weightLbs: parseFloat(document.getElementById('f_weightLbs').value)
  };

  if (currentEditIndex >= 0) {
    entries[currentEditIndex] = entry;
    currentEditIndex = -1;
  } else {
    entries.unshift(entry);
  }

  renderTable();
  showToast('✅ Entry saved successfully');
  UI.closeEntry();
});

// Button Connections
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnAdd').addEventListener('click', () => {
    currentEditIndex = -1;
    document.getElementById('entryModalTitle').textContent = 'Add Entry';
    document.getElementById('entryModal').classList.add('show');
  });

  document.getElementById('btnRefresh').addEventListener('click', () => {
    renderTable();
    showToast('✅ Refreshed');
  });

  document.getElementById('btnFields').addEventListener('click', () => {
    document.getElementById('fieldsModal').classList.add('show');
  });

  document.getElementById('btnThresholds').addEventListener('click', () => {
    document.getElementById('thModal').classList.add('show');
  });

  document.getElementById('btnOptions').addEventListener('click', () => {
    document.getElementById('optModal').classList.add('show');
  });

  // Sample Data
  entries = [
    { date: "2026-04-17", glucose: 98, sys: 118, dia: 76, weightLbs: 185 },
    { date: "2026-04-16", glucose: 105, sys: 122, dia: 80, weightLbs: 186 }
  ];

  renderTable();
  showToast('✅ Health Tracker is ready');
});
