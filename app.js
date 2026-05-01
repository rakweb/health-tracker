/* =====================================================
   Health Tracker — app.js (root version)
   ===================================================== */

/* ---------- Globals (declare ONCE) ---------- */
let db = null;
let chart = null;
let deferredPrompt = null;

/* ---------- Theme ---------- */
function toggleTheme() {
  const root = document.documentElement;
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  localStorage.setItem("theme", next);
}

/* ---------- IndexedDB ---------- */
const DB_NAME = "healthTrackerDB";
const DB_VER = 1;

function openDB() {
  return new Promise(resolve => {
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
  });
}

function getAll(store) {
  return new Promise(resolve => {
    const r = db.transaction(store, "readonly")
      .objectStore(store)
      .getAll();
    r.onsuccess = () => resolve(r.result || []);
  });
}

/* ---------- Chart ---------- */
function renderChart(entries) {
  const c = document.getElementById("chart");
  if (!c) return;

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
  chart = new Chart(c, {
    type: "line",
    data: { labels: dates, datasets },
    options: {
      scales: {
        x: { ticks: { color: "black" } },
        y: { ticks: { color: "black" } }
      },
      plugins: {
        legend: { labels: { color: "black" } }
      }
    }
  });
}

/* ---------- Refresh ---------- */
async function refresh() {
  if (!db) return;
  renderChart(await getAll("entries"));
}

/* ---------- Entries ---------- */
function addEntry() {
  const d = eDate.value;
  const f = eField.value.trim();
  const v = Number(eValue.value);
  if (!d || !f || isNaN(v)) return;

  db.transaction("entries", "readwrite")
    .objectStore("entries")
    .add({ date: d, field: f, value: v })
    .onsuccess = refresh;

  closeModal();
}

/* ---------- Modals ---------- */
function showModal(id) {
  modalBackdrop.classList.remove("hidden");
  document.getElementById(id).classList.remove("hidden");
}
function closeModal() {
  document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden"));
  modalBackdrop.classList.add("hidden");
}

/* ---------- PWA Install (safe) ---------- */
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
});

function installApp() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.finally(() => deferredPrompt = null);
}

/* ---------- Init ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  document.documentElement.dataset.theme =
    localStorage.getItem("theme") || "light";

  await openDB();
  refresh();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
});
