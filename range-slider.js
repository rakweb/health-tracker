// Range slider helper
document.addEventListener('input', (e) => {
  const el = e.target;
  if (!el.classList.contains('score-range')) return;

  const value = (el.value - el.min) / (el.max - el.min) * 100;
  el.style.background = `
    linear-gradient(
      to right,
      #27d79b 0%,
      #27d79b ${value}%,
      #1f2a45 ${value}%,
      #1f2a45 100%
    )
  `;
});

// Initialize all sliders
document.querySelectorAll('.score-range').forEach(el => {
  el.dispatchEvent(new Event('input'));
});
``
