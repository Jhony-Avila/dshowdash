import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { _container, _state, _handlers, _autoSaveTimeout, setAutoSaveTimeout } from "./state.js";
import { AUTO_SAVE_DELAY } from "./constants.js";
const MODULE_ID = "panel-user-preferences.events.utils";
const VERSION = "9.3.0-P2-ENTERPRISE";
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const announce = (message) => {
  const region = _container?.querySelector(".pup-live-region");
  if (region) {
    region.textContent = message;
    setTimeout(() => {
      region.textContent = "";
    }, 1e3);
  }
};
const showToast = (message, type = "success") => {
  _initPorts();
  const t = _getPort("toast");
  t?.show?.(message, type);
};
const setButtonLoading = (btn, loading) => {
  if (!btn) return;
  if (loading) {
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pup-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>';
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
    btn.disabled = false;
  }
};
const openModal = (modalId) => {
  const modal = _container?.querySelector(`#${modalId}`);
  if (modal) {
    modal.classList.add("visible");
    const btn = modal.querySelector("button");
    btn?.focus();
  }
};
const closeModal = (modalId) => {
  const modal = _container?.querySelector(`#${modalId}`);
  modal?.classList.remove("visible");
};
const scheduleAutoSave = () => {
  if (_autoSaveTimeout) clearTimeout(_autoSaveTimeout);
  const timeout = setTimeout(() => {
    if (_state?.isDirty && _handlers?.saveAllChanges) {
      const logger = _getPort("logger");
      logger?.log?.("[Events] Auto-save triggered");
      _handlers.saveAllChanges().then(() => {
        showToast("Altera\xE7\xF5es salvas automaticamente", "info");
      });
    }
  }, AUTO_SAVE_DELAY);
  setAutoSaveTimeout(timeout);
};
const cancelAutoSave = () => {
  if (_autoSaveTimeout) {
    clearTimeout(_autoSaveTimeout);
    setAutoSaveTimeout(null);
  }
};
const addMicroAnimation = (el, animClass) => {
  if (!el) return;
  el.classList.add(animClass);
  setTimeout(() => {
    el.classList.remove(animClass);
  }, 300);
};
const requestPushPermission = () => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    showToast("Navegador n\xE3o suporta notifica\xE7\xF5es push", "warning");
    return Promise.resolve(false);
  }
  if (Notification.permission === "granted") return Promise.resolve(true);
  if (Notification.permission === "denied") {
    showToast("Notifica\xE7\xF5es bloqueadas pelo navegador", "warning");
    return Promise.resolve(false);
  }
  return Notification.requestPermission().then((permission) => permission === "granted");
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() });
const healthCheck = () => ({ status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { utilsReady: true } });
var utils_default = { announce, showToast, setButtonLoading, openModal, closeModal, scheduleAutoSave, cancelAutoSave, addMicroAnimation, requestPushPermission, info, healthCheck, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  addMicroAnimation,
  announce,
  cancelAutoSave,
  closeModal,
  utils_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  openModal,
  requestPushPermission,
  scheduleAutoSave,
  setButtonLoading,
  showToast
};
