/* =====================================================
   Health Tracker – app.js (authoritative)
   ===================================================== */

/* =========================
   Globals (DECLARED ONCE)
========================= */
// Prevent double‑evaluation (GitHub Pages + SW safety)
if (window.__healthTrackerLoaded) {
  console.warn("app.js already loaded – skipping");
  throw new Error("Duplicate app.js load");
}
window.__healthTrackerLoaded = true;

// Globals (declared exactly once)
let db = null;
let chart = null;
let deferredPrompt = null;

/* =========================
   IndexedDB
========================= */
const DB_NAME = "healthTrackerDB";
const DB_VER = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);

    req.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains("entries"))
        d.createObjectStore("entries", { keyPath: "id", autoIncrement: true });
      if (!d.objectStoreNames.contains("thresholds"))
        d.createObjectStore("thresholds", { keyPath: "field" });
    };

    req.onsuccess = e => {
      db = e.target.result;
      resolve();
    };

    req.onerror = () => reject("IndexedDB failed");
  });
}

function getAll(store) {
  return new Promise(resolve => {
    const req = db.transaction(store, "readonly")
      .objectStore(store)
      .getAll();
    req.onsuccess = () => resolve(req.result || []);
  });
}

/* =========================
   Chart
========================= */
function renderChart(entries) {
  const canvas = document.getElementById("chart");
  if (!canvas) return;

  const dates = [...new Set(entries.map(e => e.date))].sort();
  const fields = [...new Set(entries.map(e => e.field))];

  const datasets = fields.map(f => ({
    label: f,
    data: dates.map(d => {
      const m = entries.find(e => e.field === f && e.date === d);
      return m ? m.value : null;
    }),
    borderWidth: 2,
    spanGaps: true
  }));

  chart?.destroy();
  chart = new Chart(canvas, {
    type: "line",
    data: { labels: dates, datasets },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "black" } }
      },
      scales: {
        x: { ticks: { color: "black" } },
        y: { ticks: { color: "black" } }
      }
    }
  });
}

/* =========================
   Refresh
========================= */
async function refresh() {
  if (!db) return;
  const entries = await getAll("entries");
  renderChart(entries);
}

/* =========================
   Entries
========================= */
function addEntry() {
  const d = document.getElementById("eDate").value;
  const f = document.getElementById("eField").value.trim();
  const v = Number(document.getElementById("eValue").value);
  if (!d || !f || isNaN(v)) return;

  db.transaction("entries", "readwrite")
    .objectStore("entries")
    .add({ date: d, field: f, value: v })
    .onsuccess = refresh;

  closeModal();
}

/* =========================
   Fields
========================= */
async function openFields() {
  const entries = await getAll("entries");
  const list = document.getElementById("fieldList");
  list.innerHTML = "";

  [...new Set(entries.map(e => e.field))].forEach(f => {
    list.innerHTML +=
      `<label><input type="checkbox" value="${f}"> ${f}</label><br>`;
  });

  showModal("fieldModal");
}

function deleteFields() {
  const selected =
    [...document.querySelectorAll("#fieldList input:checked")]
      .map(i => i.value);

  if (!selected.length) return;

  const store = db.transaction("entries", "readwrite").objectStore("entries");
  store.openCursor().onsuccess = e => {
    const c = e.target.result;
    if (!c) return;
    if (selected.includes(c.value.field)) c.delete();
    c.continue();
  };

  closeModal();
  setTimeout(refresh, 300);
}

/* =========================
   Thresholds
========================= */
function saveThreshold() {
  const f = tField.value.trim();
  const min = Number(tMin.value);
  const max = Number(tMax.value);
  if (!f) return;

  db.transaction("thresholds", "readwrite")
    .objectStore("thresholds")
    .put({ field: f, min, max })
    .onsuccess = loadThresholds;
}

async function loadThresholds() {
  const t = await getAll("thresholds");
  thresholdList.innerHTML = "";
  t.forEach(x => {
    thresholdList.innerHTML +=
      `${x.field}: ${x.min}–${x.max}
       <button onclick="delThreshold('${x.field}')">✕</button><br>`;
  });
}

function delThreshold(f) {
  db.transaction("thresholds", "readwrite")
    .objectStore("thresholds")
    .delete(f)
    .onsuccess = refresh;
}

/* =========================
   CSV / PDF
========================= */
async function saveCSV() {
  const e = await getAll("entries");
  const csv = "date,field,value\n" +
    e.map(x => `${x.date},${x.field},${x.value}`).join("\n");

  download(csv, "health-data.csv", "text/csv");
}

function savePDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  pdf.text("Health Metrics", 10, 10);
  pdf.addImage(chart.toBase64Image(), "PNG", 10, 20, 180, 80);
  pdf.save("metrics.pdf");
}

function download(content, name, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
}

/* =========================
   CSV Import
========================= */
function importCSV(file) {
  const r = new FileReader();
  r.onload = () => {
    const store = db.transaction("entries", "readwrite")
      .objectStore("entries");

    r.result.split("\n").slice(1).forEach(l => {
      const [d, f, v] = l.split(",");
      if (d && f) store.add({ date: d, field: f, value: Number(v) });
    });

    refresh();
  };
  r.readAsText(file);
}

/* =========================
   Theme
========================= */
function toggleTheme() {
  const root = document.documentElement;
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  localStorage.setItem("theme", next);
}

/* =========================
   Modals
========================= */
function showModal(id) {
  document.getElementById("modalBackdrop").classList.remove("hidden");
  document.getElementById(id).classList.remove("hidden");
}

function closeModal() {
  document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden"));
  document.getElementById("modalBackdrop").classList.add("hidden");
}

/* =========================
   PWA Install (SAFE)
========================= */
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
});

function installApp() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(() => deferredPrompt = null);
}

/* =========================
   Init
========================= */
document.addEventListener("DOMContentLoaded", async () => {
  document.documentElement.dataset.theme =
    localStorage.getItem("theme") || "light";

  await openDB();
  refresh();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
});

let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
  // Optional: show Install button here
});

function installApp() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.finally(() => {
    deferredPrompt = null;
  });
}
