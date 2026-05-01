/* =====================================================
   Health Tracker — app.js (clean authoritative version)
   ===================================================== */

/* -----------------------------------------------------
   Hard guard against double execution
----------------------------------------------------- */
(() => {
  if (window.__healthTrackerAppLoaded) {
    console.warn("app.js already loaded — aborting duplicate execution");
    return;
  }
  window.__healthTrackerAppLoaded = true;

  /* -----------------------------------------------------
     GLOBAL STATE (DECLARED EXACTLY ONCE)
  ----------------------------------------------------- */
  let db = null;
  let chart = null;
  let deferredPrompt = null;

  /* -----------------------------------------------------
     THEME
  ----------------------------------------------------- */
  window.toggleTheme = function () {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem("theme", next);
  };

  /* -----------------------------------------------------
     INDEXEDDB
  ----------------------------------------------------- */
  const DB_NAME = "healthTrackerDB";
  const DB_VER = 1;

  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VER);

      req.onupgradeneeded = e => {
        const d = e.target.result;
        if (!d.objectStoreNames.contains("entries")) {
          d.createObjectStore("entries", {
            keyPath: "id",
            autoIncrement: true
          });
        }
        if (!d.objectStoreNames.contains("thresholds")) {
          d.createObjectStore("thresholds", { keyPath: "field" });
        }
      };

      req.onsuccess = e => {
        db = e.target.result;
        resolve();
      };

      req.onerror = () => reject("IndexedDB open failed");
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

  /* -----------------------------------------------------
     CHART
  ----------------------------------------------------- */
  function renderChart(entries) {
    const canvas = document.getElementById("chart");
    if (!canvas || !window.Chart) return;

    const dates = [...new Set(entries.map(e => e.date))].sort();
    const fields = [...new Set(entries.map(e => e.field))];

    const datasets = fields.map(field => ({
      label: field,
      data: dates.map(d => {
        const m = entries.find(e => e.date === d && e.field === field);
        return m ? m.value : null;
      }),
      borderWidth: 2,
      spanGaps: true
    }));

    if (chart) chart.destroy();

    chart = new Chart(canvas, {
      type: "line",
      data: { labels: dates, datasets },
      options: {
        responsive: true,
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

  /* -----------------------------------------------------
     REFRESH
  ----------------------------------------------------- */
  async function refresh() {
    if (!db) return;
    const entries = await getAll("entries");
    renderChart(entries);
  }

  window.refresh = refresh;

  /* -----------------------------------------------------
     ENTRIES
  ----------------------------------------------------- */
  window.addEntry = function () {
    const d = eDate.value;
    const f = eField.value.trim();
    const v = Number(eValue.value);

    if (!d || !f || Number.isNaN(v)) return;

    db.transaction("entries", "readwrite")
      .objectStore("entries")
      .add({ date: d, field: f, value: v })
      .onsuccess = refresh;

    closeModal();
  };

  /* -----------------------------------------------------
     MODALS
  ----------------------------------------------------- */
  window.showModal = function (id) {
    modalBackdrop.classList.remove("hidden");
    document.getElementById(id).classList.remove("hidden");
  };

  window.closeModal = function () {
    document.querySelectorAll(".modal").forEach(m =>
      m.classList.add("hidden")
    );
    modalBackdrop.classList.add("hidden");
  };

  /* -----------------------------------------------------
     PWA INSTALL (CORRECT + SAFE)
  ----------------------------------------------------- */
  window.addEventListener("beforeinstallprompt", e => {
    e.preventDefault();
    deferredPrompt = e;
  });

  window.installApp = function () {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.finally(() => {
      deferredPrompt = null;
    });
  };

  /* -----------------------------------------------------
     INIT
  ----------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", async () => {
    // Restore theme
    document.documentElement.dataset.theme =
      localStorage.getItem("theme") || "light";

    // Open DB
    await openDB();
    refresh();

    // Service worker (only if present)
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }
  });

})();
