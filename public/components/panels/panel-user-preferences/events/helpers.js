import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { UI_INTENTS } from "/core/runtime/events/catalog/ui.events.js";
import { ACCESSIBILITY_INTENTS } from "/core/runtime/events/catalog/accessibility.events.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-preferences.events.helpers";
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _emitIntent = (intent, data) => {
  _initPorts();
  const eb = _getPort("eventBus");
  eb?.emit?.(intent, { source: MODULE_ID, timestamp: Date.now(), ...data || {} });
};
let _container = null;
const setContainer = (container) => {
  _container = container;
};
const getContainer = () => _container;
const announce = (message) => {
  _emitIntent(ACCESSIBILITY_INTENTS.ANNOUNCE, { message, priority: "polite", context: "helpers" });
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
  _emitIntent(UI_INTENTS.SHOW_TOAST, { message, type });
  const t = _getPort("toast");
  t?.show?.(message, type);
};
const setButtonLoading = (btn, loading) => {
  if (!btn) return;
  const htmlBtn = btn;
  if (loading) {
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="pup-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>';
    htmlBtn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
    htmlBtn.disabled = false;
  }
};
const openModal = (modalId) => {
  _emitIntent(UI_INTENTS.OPEN_MODAL, { modalId });
  const modal = _container?.querySelector(`#${modalId}`);
  if (modal) {
    modal.classList.add("visible");
    modal.querySelector("button")?.focus();
  }
};
const closeModal = (modalId) => {
  _emitIntent(UI_INTENTS.CLOSE_MODAL, { modalId });
  _container?.querySelector(`#${modalId}`)?.classList.remove("visible");
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
const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), usingP18Intents: true });
const healthCheck = () => ({ status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { helpersReady: true, p18IntentsAvailable: true } });
var helpers_default = { VERSION, MODULE_ID, setContainer, getContainer, announce, showToast, setButtonLoading, openModal, closeModal, addMicroAnimation, requestPushPermission, info, healthCheck, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  addMicroAnimation,
  announce,
  closeModal,
  helpers_default as default,
  getContainer,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  openModal,
  requestPushPermission,
  setButtonLoading,
  setContainer,
  showToast
};
