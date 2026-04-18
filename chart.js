let entries = [];
let chartInstance = null;

const showToast = (msg) => {
  const toast = document.getElementById('updateToast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
};

window.UI = {
  closeEntry: () => document.getElementById('entryModal').classList.remove('show')
};

// Render Table
function renderTable() {
  const tbody = document.getElementById('tableBody');
  tbody.innerHTML = entries.map((e, i) => `
    <tr>
      <td>${e.date}</td>
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

window.deleteEntry = (i) => {
  if (confirm('Delete entry?')) {
    entries.splice(i, 1);
    renderTable();
    renderChart();
  }
};

window.editEntry = (i) => {
  // Basic edit - can be expanded
  const e = entries[i];
  document.getElementById('f_date').value = e.date;
  document.getElementById('f_glucose').value = e.glucose;
  document.getElementById('f_sys').value = e.sys;
  document.getElementById('f_dia').value = e.dia;
  document.getElementById('f_weightLbs').value = e.weightLbs;
  document.getElementById('entryModal').classList.add('show');
};

// Save Entry
document.getElementById('btnSaveEntry').addEventListener('click', () => {
  const entry = {
    date: document.getElementById('f_date').value || new Date().toISOString().slice(0,10),
    glucose: parseFloat(document.getElementById('f_glucose').value),
    sys: parseFloat(document.getElementById('f_sys').value),
    dia: parseFloat(document.getElementById('f_dia').value),
    weightLbs: parseFloat(document.getElementById('f_weightLbs').value)
  };
  entries.unshift(entry);
  renderTable();
  renderChart();
  showToast('✅ Entry Saved');
  UI.closeEntry();
});

// Trend Chart
function renderChart() {
  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(document.getElementById('metricsChart'), {
    type: 'line',
    data: {
      labels: entries.map(e => e.date),
      datasets: [
        { label: 'Glucose', data: entries.map(e => e.glucose), borderColor: '#4ba3ff', tension: 0.3 },
        { label: 'Systolic', data: entries.map(e => e.sys), borderColor: '#ff5c5c', tension: 0.3 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

// Export
document.getElementById('btnSaveCSV').addEventListener('click', () => {
  let csv = "Date,Glucose,Sys,Dia,Weight\n";
  entries.forEach(e => csv += `${e.date},${e.glucose},${e.sys},${e.dia},${e.weightLbs}\n`);
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'health_data.csv';
  a.click();
  showToast('CSV Exported');
});

document.getElementById('btnSavePDF').addEventListener('click', () => {
  const { jsPDF } = jspdf;
  const doc = new jsPDF();
  doc.text("Health Tracker Report", 20, 20);
  doc.text(`Entries: ${entries.length}`, 20, 30);
  doc.save("health_report.pdf");
  showToast('PDF Exported');
});

// Activate All Buttons
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnAdd').addEventListener('click', () => {
    document.getElementById('entryModal').classList.add('show');
  });

  document.getElementById('btnRefresh').addEventListener('click', () => {
    renderTable();
    renderChart();
    showToast('Refreshed');
  });

  document.getElementById('btnImportCSV').addEventListener('click', () => document.getElementById('importFile').click());

  // Sample Data
  entries = [
    {date:"2026-04-17", glucose:98, sys:118, dia:76, weightLbs:185},
    {date:"2026-04-16", glucose:105, sys:122, dia:80, weightLbs:186}
  ];

  renderTable();
  renderChart();
  showToast('Health Tracker Ready');
});
