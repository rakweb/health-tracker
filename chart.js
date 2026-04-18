let entries = [];
let chartInstance = null;

const showToast = (msg) => {
  const t = document.getElementById('updateToast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
};

window.UI = {
  closeEntry: () => document.getElementById('entryModal').classList.remove('show'),
  closeFields: () => document.getElementById('fieldsModal').classList.remove('show'),
  closeThresholds: () => document.getElementById('thModal').classList.remove('show'),
  closeOptions: () => document.getElementById('optModal').classList.remove('show')
};

// Render Table
function renderTable() {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = entries.map((e,i) => `
    <tr>
      <td>${e.date}</td>
      <td>${e.glucose||'—'}</td>
      <td>${e.sys||'—'}/${e.dia||'—'}</td>
      <td>${e.weightLbs||'—'}</td>
      <td><button class="btn" onclick="editEntry(${i})">Edit</button>
          <button class="btn danger" onclick="deleteEntry(${i})">Delete</button></td>
    </tr>
  `).join('');
}

window.editEntry = (i) => { /* implement as needed */ };
window.deleteEntry = (i) => {
  if (confirm('Delete?')) { entries.splice(i,1); renderTable(); renderChart(); }
};

// Save Entry
document.getElementById('btnSaveEntry').addEventListener('click', () => {
  entries.unshift({
    date: document.getElementById('f_date').value || new Date().toISOString().slice(0,10),
    glucose: +document.getElementById('f_glucose').value,
    sys: +document.getElementById('f_sys').value,
    dia: +document.getElementById('f_dia').value,
    weightLbs: +document.getElementById('f_weightLbs').value
  });
  renderTable();
  renderChart();
  showToast('Entry saved');
  UI.closeEntry();
});

// Main Chart with Trend Analysis
function renderChart() {
  if (chartInstance) chartInstance.destroy();
  const ctx = document.getElementById('metricsChart');

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: entries.map(e => e.date),
      datasets: [
        { label: 'Glucose', data: entries.map(e => e.glucose), borderColor: '#4ba3ff', tension: 0.3 },
        { label: 'Systolic', data: entries.map(e => e.sys), borderColor: '#ff5c5c', tension: 0.3 },
        { label: 'Weight', data: entries.map(e => e.weightLbs), borderColor: '#27d79b', tension: 0.3 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

// Export Functions
document.getElementById('btnSaveCSV').addEventListener('click', () => {
  let csv = "Date,Glucose,Sys,Dia,Weight\n";
  entries.forEach(e => csv += `${e.date},${e.glucose},${e.sys},${e.dia},${e.weightLbs}\n`);
  const blob = new Blob([csv], {type: 'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'health_tracker.csv';
  a.click();
  showToast('CSV Exported');
});

document.getElementById('btnSavePDF').addEventListener('click', () => {
  const { jsPDF } = jspdf;
  const doc = new jsPDF();
  doc.text("Health Tracker Report", 20, 20);
  doc.text(`Total Entries: ${entries.length}`, 20, 30);
  doc.save("health_report.pdf");
  showToast('PDF Exported');
});

// Button Listeners
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnAdd').addEventListener('click', () => {
    document.getElementById('entryModal').classList.add('show');
  });

  document.getElementById('btnRefresh').addEventListener('click', () => {
    renderTable(); renderChart(); showToast('Refreshed');
  });

  // Sample Data
  entries = [
    {date:"2026-04-17", glucose:98, sys:118, dia:76, weightLbs:185},
    {date:"2026-04-16", glucose:105, sys:122, dia:80, weightLbs:186},
    {date:"2026-04-15", glucose:92, sys:115, dia:74, weightLbs:183}
  ];

  renderTable();
  renderChart();
  showToast('Health Tracker Ready');
});
