const MODULE_ID = "panel-19.ui.toast";
const VERSION = "9.3.0-P2-ENTERPRISE";
const TOAST_DURATION = 3e3;
function showToast(message, type = "info") {
  const container = getToastContainer();
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
        <i class="fas ${getToastIcon(type)}"></i>
        <span class="toast-message">${message}</span>
    `;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => removeToast(toast), TOAST_DURATION);
}
function getToastContainer() {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  return container;
}
function getToastIcon(type) {
  const icons = { success: "fa-check-circle", error: "fa-times-circle", warning: "fa-exclamation-triangle", info: "fa-info-circle" };
  return icons[type] || icons.info;
}
function removeToast(toast) {
  toast.classList.remove("show");
  setTimeout(() => toast.remove(), 300);
}
var toast_default = { showToast };
const ToastManager = { showToast };
export {
  MODULE_ID,
  ToastManager,
  VERSION,
  toast_default as default,
  showToast
};
