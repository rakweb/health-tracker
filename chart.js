// ==================== MODAL SWIPE TO CLOSE ====================
function addSwipeToClose(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  let startY = 0;
  let currentY = 0;

  modal.addEventListener('touchstart', e => {
    startY = e.touches[0].clientY;
  }, { passive: true });

  modal.addEventListener('touchmove', e => {
    currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    if (diff > 0) {
      modal.style.transform = `translateY(${diff}px)`;
    }
  }, { passive: true });

  modal.addEventListener('touchend', () => {
    const diff = currentY - startY;
    if (diff > 120) {  // Swipe threshold
      modal.classList.remove('show');
      modal.style.transform = '';
    } else {
      modal.style.transform = '';
    }
  });
}

// Apply swipe to all major modals
document.addEventListener('DOMContentLoaded', () => {
  const modals = ['entryModal', 'fieldsModal', 'thModal', 'optModal', 'bulkRemoveModal'];
  modals.forEach(id => addSwipeToClose(id));
});
