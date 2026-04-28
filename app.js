/* ================= VERSION DISPLAY ================= */
window.addEventListener('DOMContentLoaded', () => {
  const v = document.getElementById('appVersion');
  if (v) v.textContent = `Version ${APP_VERSION}`;

  // Update detection
  const KEY = 'healthTrackerVersion';
  const prev = localStorage.getItem(KEY);

  if (prev && prev !== APP_VERSION) {
    document.getElementById('updateToast')?.classList.add('show');
  }
  localStorage.setItem(KEY, APP_VERSION);

  document.getElementById('btnReloadNow')?.addEventListener('click', () => {
    location.reload(true);
  });

  document.getElementById('btnDismissToast')?.addEventListener('click', () => {
    document.getElementById('updateToast')?.classList.remove('show');
  });

  document.getElementById('btnCheckUpdates')?.addEventListener('click', () => {
    location.reload(true);
  });
});

/* ================= YOUR EXISTING APP LOGIC ================= */
/* Everything else in your original app.js stays the same */
``
