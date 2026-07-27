const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/toast";
const ICONS = {
  success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>',
  error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
  warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>'
};
let container = null;
function ensureContainer() {
  if (!container) {
    container = document.createElement("div");
    container.className = "p01-toast-container";
    document.body.appendChild(container);
  }
  return container;
}
function show(message, type = "info", duration = 4e3) {
  const cont = ensureContainer();
  const toast = document.createElement("div");
  toast.className = `p01-toast p01-toast--${type}`;
  toast.innerHTML = `
    <span class="p01-toast-icon">${ICONS[type] || ICONS.info}</span>
    <span class="p01-toast-message">${message}</span>
    <button class="p01-toast-close" aria-label="Fechar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
  `;
  toast.querySelector(".p01-toast-close").addEventListener("click", () => remove(toast));
  cont.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("p01-toast--show"));
  if (duration > 0) setTimeout(() => remove(toast), duration);
  return toast;
}
function remove(toast) {
  toast.classList.remove("p01-toast--show");
  toast.addEventListener("transitionend", () => toast.remove(), { once: true });
}
const success = (msg, dur) => show(msg, "success", dur);
const error = (msg, dur) => show(msg, "error", dur);
const warning = (msg, dur) => show(msg, "warning", dur);
const info = (msg, dur) => show(msg, "info", dur);
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var toast_default = { show, success, error, warning, info };
export {
  MODULE_ID,
  VERSION,
  toast_default as default,
  error,
  healthCheck,
  info,
  show,
  success,
  warning
};
