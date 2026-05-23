export const UI = {
  showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('toast--show');
    setTimeout(() => toast.classList.remove('toast--show'), 2800);
  },

  openModal(modalId) {
    document.getElementById(modalId)?.classList.add('modal-overlay--open');
  },

  closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove('modal-overlay--open');
  }
};