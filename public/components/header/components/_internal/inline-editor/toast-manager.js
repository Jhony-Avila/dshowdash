const VERSION = "1.1.0-ENTERPRISE";
const MODULE_ID = "header-ui-inline-editor-toast-manager";
import { getToastIcon } from "./dom-builder.js";
let activeToast = null;
let _metrics = { toasts: 0, confirms: 0 };
function showToast(message, type = "success", duration = 2500) {
  _metrics.toasts++;
  if (activeToast) {
    activeToast.remove();
    activeToast = null;
  }
  const existing = document.querySelector(".hie-toast");
  if (existing) existing.remove();
  const iconHtml = getToastIcon(type);
  const toast = document.createElement("div");
  toast.className = `hie-toast hie-toast-${type}`;
  toast.setAttribute("role", "alert");
  toast.innerHTML = `${iconHtml}<span>${message}</span>`;
  document.body.appendChild(toast);
  activeToast = toast;
  requestAnimationFrame(() => toast.classList.add("hie-visible"));
  setTimeout(() => {
    toast.classList.remove("hie-visible");
    setTimeout(() => {
      toast.remove();
      if (activeToast === toast) activeToast = null;
    }, 300);
  }, duration);
  return toast;
}
function showConfirmDialog() {
  _metrics.confirms++;
  const overlay = document.getElementById("hie-confirm-overlay");
  if (overlay) {
    overlay.classList.add("hie-visible");
    overlay.querySelector(".hie-confirm-btn.hie-primary")?.focus();
  }
}
function hideConfirmDialog() {
  const overlay = document.getElementById("hie-confirm-overlay");
  if (overlay) overlay.classList.remove("hie-visible");
}
function showEditBanner() {
  const banner = document.getElementById("hie-edit-banner");
  if (banner) banner.classList.add("hie-visible");
}
function hideEditBanner() {
  const banner = document.getElementById("hie-edit-banner");
  if (banner) banner.classList.remove("hie-visible");
}
function setDoneButtonState(state) {
  const doneBtn = document.getElementById("hie-done-btn");
  if (!doneBtn) return;
  doneBtn.classList.remove("hie-has-changes", "hie-saving", "hie-saved");
  if (state === "hasChanges") {
    doneBtn.classList.add("hie-has-changes");
  } else if (state === "saving") {
    doneBtn.classList.add("hie-saving");
  } else if (state === "saved") {
    doneBtn.classList.add("hie-saved");
    setTimeout(() => doneBtn.classList.remove("hie-saved"), 1500);
  }
}
function setResetButtonVisible(visible) {
  const resetBtn = document.getElementById("hie-reset-btn");
  if (resetBtn) resetBtn.classList.toggle("hie-visible", visible);
}
function setEditModeUI(active) {
  const header = document.querySelector(".site-header");
  if (header) header.classList.toggle("hie-edit-mode", active);
  if (active) {
    showEditBanner();
  } else {
    hideEditBanner();
    setDoneButtonState("default");
    setResetButtonVisible(false);
  }
}
function clearActiveToast() {
  if (activeToast) {
    activeToast.remove();
    activeToast = null;
  }
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { toastReady: true }, metrics: getMetrics() };
}
var toast_manager_default = { showToast, showConfirmDialog, hideConfirmDialog, showEditBanner, hideEditBanner, setDoneButtonState, setResetButtonVisible, setEditModeUI, clearActiveToast, getMetrics, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  clearActiveToast,
  toast_manager_default as default,
  getMetrics,
  healthCheck,
  hideConfirmDialog,
  hideEditBanner,
  info,
  setDoneButtonState,
  setEditModeUI,
  setResetButtonVisible,
  showConfirmDialog,
  showEditBanner,
  showToast
};
