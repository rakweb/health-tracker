// ==================== HEALTH TRACKER - chart.js ====================

let entries = [];
let chartInstance = null;
let currentEditIndex = -1;
let currentMeds = [];
let selectedFields = ["date", "time", "glucose", "sys", "dia", "weightLbs", "waistIn", "spo2", "hr"];

// Toast Notification
function showToast(message) {
  const toast = document.getElementById('updateToast');
  if (toast) {
    toast.innerHTML = `<span>${message}</span>`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2800);
  }
}

// UI Close Helpers
window.UI = {
  closeEntry: () => document.getElementById('entryModal').classList.remove('show'),
  closeFields: () => document.getElementById('fieldsModal').classList.remove('show'),
  closeBulkRemove: () => document.getElementById('bulkRemoveModal').classList.remove('show'),
  closeThresholds: () => document.getElementById('thModal').classList.remove('show'),
  closeOptions: () => document.getElementById('optModal').classList.remove('show')
};

// Populate Fields Grid
function populateFieldsGrid() {
  const grid = document.getElementById('fieldsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const allFields = [
    {key: 'date', label: 'Date'},
    {key: 'time', label: 'Time'},
    {key: 'glucose', label: 'Glucose'},
    {key: 'sys', label: 'Systolic BP'},
    {key: 'dia', label: 'Diastolic BP'},
    {key: 'weightLbs', label: 'Weight (lbs)'},
    {key: 'waistIn', label: 'Waist (in)'},
    {key: 'spo2', label: 'SpO₂'},
    {key: 'hr', label: 'Heart Rate'},
    {key: 'pain', label: 'Pain Level'},
    {key: 'symptoms', label: 'Symptoms'}
  ];

  allFields.forEach(field => {
    const checked = selectedFields.includes(field.key) ? 'checked' : '';
    const div = document.createElement('div');
    div.innerHTML = `
      <input type="checkbox" id="field_${field.key}" ${checked}>
      <label for="field_${field.key}">${field.label}</label>
    `;
    grid.appendChild(div);
  });
}

// Render Table
function renderTable() {
  const tbody = document.getElementById('tableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  entries.forEach((entry, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${entry.date || '—'}</td>
      <td>${entry.time || '—'}</td>
      <td>${entry.glucose || '—'}</td>
      <td>${entry.sys || '—'}/${entry.dia || '—'}</td>
      <td>${entry.weightLbs || '—'}</td>
      <td>
        <button class="btn" onclick="editEntry(${index})">Edit</button>
        <button class="btn danger" onclick="deleteEntry(${index})">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.editEntry = function(index) {
  currentEditIndex = index;
  const e = entries[index];

  document.getElementById('entryModalTitle').textContent = 'Edit Entry';
  document.getElementById('f_date').value = e.date || '';
  document.getElementById('f_time').value = e.time || '';
  document.getElementById('f_glucose').value = e.glucose || '';
  document.getElementById('f_sys').value = e.sys || '';
  document.getElementById('f_dia').value = e.dia || '';
  document.getElementById('f_weightLbs').value = e.weightLbs || '';
  document.getElementById('f_waistIn').value = e.waistIn || '';
  document.getElementById('f_spo2').value = e.spo2 || '';
  document.getElementById('f_hr').value = e.hr || '';
  document.getElementById('f_pain').value = e.pain || 0;
  document.getElementById('painVal').textContent = e.pain || 0;
  document.getElementById('f_symptoms').value = e.symptoms || 0;
  document.getElementById('symptomsVal').textContent = e.symptoms || 0;

  document.getElementById('btnDeleteEntry').style.display = 'inline-block';
  document.getElementById('entryModal').classList.add('show');
};

window.deleteEntry = function(index) {
  if (confirm('Delete this entry?')) {
    entries.splice(index, 1);
    renderTable();
    updateKPIs();
    renderChart();
    showToast('Entry deleted');
  }
};

// Save Entry
document.get
