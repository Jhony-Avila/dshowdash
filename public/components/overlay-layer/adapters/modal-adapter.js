import { createUiPorts } from "/core/runtime/ports-profiles.js";
import * as Manager from "../core/manager.js";
const VERSION = "2.3.0-P17WI";
const MODULE_ID = "overlay-layer.adapters.modal-adapter";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _metrics = { openCount: 0, closeCount: 0, confirmCount: 0, customCount: 0 };
const _pendingConfirms = {};
const _customModalCallbacks = {};
function open(id, content, config) {
  if (!config) config = {};
  _metrics.openCount++;
  return Manager.open({ id, type: "modal", content, config });
}
function close(id, reason) {
  _metrics.closeCount++;
  return Manager.close(id, reason);
}
function closeModal(id, reason) {
  return close(id, reason);
}
function closeAll() {
  return Manager.closeAll("modal-adapter");
}
function showConfirmModal(options) {
  if (!options) options = {};
  _metrics.confirmCount++;
  const id = options.id || `confirm-modal-${Date.now()}`;
  const title = options.title || "Confirmar";
  const message = options.message || "Tem certeza?";
  const confirmText = options.confirmText || "Confirmar";
  const cancelText = options.cancelText || "Cancelar";
  const danger = options.danger || false;
  return new Promise((resolve) => {
    _pendingConfirms[id] = resolve;
    const dangerClass = danger ? " overlay-confirm-btn--danger" : "";
    const content = `<div class="overlay-confirm-modal" data-confirm-id="${id}"><div class="overlay-confirm-header"><h3 class="overlay-confirm-title">${title}</h3></div><div class="overlay-confirm-body"><p class="overlay-confirm-message">${message}</p></div><div class="overlay-confirm-footer"><button type="button" class="overlay-confirm-btn overlay-confirm-btn--cancel" data-action="cancel">${cancelText}</button><button type="button" class="overlay-confirm-btn overlay-confirm-btn--confirm${dangerClass}" data-action="confirm">${confirmText}</button></div></div>`;
    const result = Manager.open({ id, type: "modal", content, config: { closable: true, backdrop: true, keyboard: true, size: "small", scope: options.scope || MODULE_ID } });
    if (!result.ok) {
      delete _pendingConfirms[id];
      resolve(false);
      return;
    }
    setTimeout(() => {
      const modal = document.querySelector(`[data-confirm-id="${id}"]`);
      if (!modal) {
        delete _pendingConfirms[id];
        resolve(false);
        return;
      }
      const confirmBtn = modal.querySelector('[data-action="confirm"]');
      const cancelBtn = modal.querySelector('[data-action="cancel"]');
      const cleanup = () => {
        if (confirmBtn) confirmBtn.removeEventListener("click", handleConfirm);
        if (cancelBtn) cancelBtn.removeEventListener("click", handleCancel);
      };
      const handleConfirm = () => {
        cleanup();
        Manager.close(id);
        const resolver = _pendingConfirms[id];
        delete _pendingConfirms[id];
        if (resolver) resolver(true);
      };
      const handleCancel = () => {
        cleanup();
        Manager.close(id);
        const resolver = _pendingConfirms[id];
        delete _pendingConfirms[id];
        if (resolver) resolver(false);
      };
      if (confirmBtn) confirmBtn.addEventListener("click", handleConfirm);
      if (cancelBtn) cancelBtn.addEventListener("click", handleCancel);
    }, 0);
  });
}
function showCustomModal(options) {
  if (!options) options = {};
  _metrics.customCount++;
  const id = options.id || `custom-modal-${Date.now()}`;
  const title = options.title || "Modal";
  const bodyHTML = options.bodyHTML || "";
  const buttons = options.buttons || [{ id: "close", text: "Fechar", variant: "secondary", action: "close" }];
  const onBeforeClose = options.onBeforeClose || null;
  return new Promise((resolve) => {
    const buttonsHTML = buttons.map((btn) => {
      const variantClass = btn.variant === "primary" ? "overlay-custom-btn--primary" : btn.variant === "danger" ? "overlay-custom-btn--danger" : "overlay-custom-btn--secondary";
      return `<button type="button" class="overlay-custom-btn ${variantClass}" data-action="${btn.action || btn.id}">${btn.text}</button>`;
    }).join("");
    const content = `<div class="overlay-custom-modal" data-custom-id="${id}"><div class="overlay-custom-header"><h3 class="overlay-custom-title">${title}</h3><button type="button" class="overlay-custom-close" data-action="close-x">&times;</button></div><div class="overlay-custom-body">${bodyHTML}</div><div class="overlay-custom-footer">${buttonsHTML}</div></div>`;
    _customModalCallbacks[id] = { onBeforeClose, resolve };
    const result = Manager.open({ id, type: "modal", content, config: { closable: true, backdrop: true, keyboard: true, size: options.size || "medium", scope: options.scope || MODULE_ID } });
    if (!result.ok) {
      delete _customModalCallbacks[id];
      resolve({ action: "error", error: "Failed to open modal" });
      return;
    }
    setTimeout(() => {
      const modal = document.querySelector(`[data-custom-id="${id}"]`);
      if (!modal) {
        delete _customModalCallbacks[id];
        resolve({ action: "error" });
        return;
      }
      const handleAction = (action) => {
        const callbacks = _customModalCallbacks[id];
        if (callbacks && callbacks.onBeforeClose) {
          const canClose = callbacks.onBeforeClose(action, modal);
          if (canClose === false) return;
        }
        Manager.close(id);
        delete _customModalCallbacks[id];
        resolve({ action });
      };
      modal.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-action]");
        if (btn) {
          const action = btn.dataset.action;
          handleAction(action === "close-x" ? "close" : action);
        }
      });
    }, 0);
  });
}
function getMetrics() {
  return { openCount: _metrics.openCount, closeCount: _metrics.closeCount, confirmCount: _metrics.confirmCount, customCount: _metrics.customCount };
}
function healthCheck() {
  const checks = { managerAvailable: !!Manager, portsInitialized: Ports.isInitialized() };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  return { status: passed === keys.length ? "HEALTHY" : "DEGRADED", score: `${passed}/${keys.length}`, checks, metrics: getMetrics(), portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics(), pendingConfirms: Object.keys(_pendingConfirms).length, pendingCustom: Object.keys(_customModalCallbacks).length, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
}
var modal_adapter_default = { open, close, closeModal, closeAll, showConfirmModal, showCustomModal, getMetrics, healthCheck, info, VERSION, MODULE_ID, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  close,
  closeAll,
  closeModal,
  modal_adapter_default as default,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  open,
  showConfirmModal,
  showCustomModal
};
