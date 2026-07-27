import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { AUTH_INTENTS } from "/core/runtime/events/catalog/auth.events.js";
import { UI_INTENTS } from "/core/runtime/events/catalog/ui.events.js";
const MODULE_ID = "login-modal-controller";
const VERSION = "4.5.0-P18EC";
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
function _emitIntent(intent, data) {
  _initPorts();
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) {
    eventBus.emit(intent, Object.assign({ source: MODULE_ID, timestamp: Date.now() }, data || {}));
    return true;
  }
  return false;
}
function _emitLayoutRequest(mode, source) {
  if (source === void 0) source = "login-modal-controller";
  _initPorts();
  const layoutManager = _getPort("layoutManager");
  if (layoutManager && layoutManager.setScrollLocked) {
    const lock = mode === "scroll-lock";
    layoutManager.setScrollLocked(lock);
    return true;
  }
  _emitIntent(UI_INTENTS.REQUEST_LAYOUT, { mode, source });
  return true;
}
class ModalController {
  constructor(modal) {
    this.modal = modal;
    this._loginRequiredCleanup = null;
  }
  async open(reason) {
    if (reason === void 0) reason = "manual";
    const m = this.modal;
    const store = m.store;
    const logger = m.logger;
    const modal = m.modal;
    const ariaManager = m.ariaManager;
    const focusTrap = m.focusTrap;
    const formComponent = m.formComponent;
    const telemetry = m.telemetry;
    const config = m.config;
    const eventBus = m.eventBus;
    if (store && store.isOpen()) {
      if (logger) logger.debug("Modal ja esta aberto");
      return;
    }
    if (logger) logger.info(`Abrindo modal (reason: ${reason})`);
    if (store) store.open();
    modal.removeAttribute("hidden");
    modal.setAttribute("aria-hidden", "false");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    _emitLayoutRequest("scroll-lock");
    if (ariaManager) ariaManager.setModalOpen();
    if (config && config.accessibility && config.accessibility.focusTrapEnabled && focusTrap) focusTrap.activate();
    if (formComponent) formComponent.focus();
    if (telemetry) telemetry.trackOpen(reason);
    _emitIntent(UI_INTENTS.OPEN_MODAL, { reason, modalId: MODULE_ID });
  }
  close(reason) {
    if (reason === void 0) reason = "manual";
    const m = this.modal;
    const store = m.store;
    const logger = m.logger;
    const modal = m.modal;
    const ariaManager = m.ariaManager;
    const focusTrap = m.focusTrap;
    const formComponent = m.formComponent;
    const errorDisplay = m.errorDisplay;
    const telemetry = m.telemetry;
    const config = m.config;
    const eventBus = m.eventBus;
    if (!store || !store.isOpen()) {
      if (logger) logger.debug("Modal ja esta fechado");
      return;
    }
    if (logger) logger.info(`Fechando modal (reason: ${reason})`);
    if (store) store.close();
    modal.setAttribute("hidden", "");
    modal.setAttribute("aria-hidden", "true");
    _emitLayoutRequest("scroll-unlock");
    if (ariaManager) ariaManager.setModalClosed();
    if (config && config.accessibility && config.accessibility.focusTrapEnabled && focusTrap) focusTrap.deactivate();
    if (formComponent) formComponent.clear();
    if (errorDisplay) errorDisplay.clear();
    if (telemetry) telemetry.trackClose(reason);
    _emitIntent(UI_INTENTS.CLOSE_MODAL, { reason, modalId: MODULE_ID });
  }
  setupLoginRequiredListener() {
    const self = this;
    const eventBus = this.modal.eventBus;
    const logger = this.modal.logger;
    if (!eventBus) {
      if (logger) logger.info("EventBus nao disponivel para setupLoginRequiredListener - funcionando standalone");
      return;
    }
    if (this._loginRequiredCleanup) {
      this._loginRequiredCleanup();
      this._loginRequiredCleanup = null;
    }
    const loginRequiredHandler = (data) => {
      if (logger) logger.info("AUTH_INTENTS.LOGIN recebido - abrindo modal", data);
      self.open("auth-required");
    };
    this._loginRequiredCleanup = eventBus.on(AUTH_INTENTS.LOGIN, loginRequiredHandler);
    if (!this.modal._handlers) this.modal._handlers = /* @__PURE__ */ new Map();
    this.modal._handlers.set(AUTH_INTENTS.LOGIN, loginRequiredHandler);
    if (logger) logger.info("Listener AUTH_INTENTS.LOGIN configurado");
  }
  triggerLoginRequired(data) {
    if (!data) data = {};
    this.open("auth-required");
  }
  cleanup() {
    if (this._loginRequiredCleanup) {
      this._loginRequiredCleanup();
      this._loginRequiredCleanup = null;
    }
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), hasLayoutManager: !!_getPort("layoutManager"), hasEventBus: !!_getPort("eventBus"), usingP18Intents: true };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { hasLayoutManager: !!_getPort("layoutManager"), hasEventBus: !!_getPort("eventBus"), p18IntentsAvailable: true } };
}
export {
  MODULE_ID,
  ModalController,
  VERSION,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
