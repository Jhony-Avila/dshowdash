import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { TELEMETRY_INTENTS } from "/core/runtime/events/catalog/telemetry.events.js";
import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
import { ORCHESTRATOR_EVENTS } from "/core/runtime/events/catalog/orchestrator.events.js";
import { OVERLAY_INTENTS } from "/core/runtime/events/catalog/overlay.events.js";
const VERSION = "1.8.0-P18EC";
const MODULE_ID = "ui-orchestrator.adapters.overlay-adapter";
const LISTENED_EVENTS = [UI_EVENTS.MODAL_OPEN_REQUEST, OVERLAY_INTENTS.OPEN, ORCHESTRATOR_EVENTS.INTENT_RESOLVED];
const MODAL_CONFIGS = { "help": { title: "Central de Ajuda", size: "lg", closable: true }, "notifications": { title: "Notifica\xE7\xF5es", size: "md", closable: true, position: "right" }, "user-menu": { title: "Menu do Usu\xE1rio", size: "sm", closable: true, position: "top-right" }, "termos": { title: "Termos de Uso", size: "lg", closable: true }, "privacidade": { title: "Pol\xEDtica de Privacidade", size: "lg", closable: true }, "lgpd": { title: "LGPD", size: "lg", closable: true } };
const Ports = createCorePorts({ moduleId: MODULE_ID });
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
const MODAL_CONTENTS = { "help": '<div class="modal-help"><h2>Central de Ajuda</h2><p>Selecione um t\xF3pico...</p></div>', "notifications": '<div class="modal-notifications"><h2>Notifica\xE7\xF5es</h2><p>Nenhuma notifica\xE7\xE3o nova.</p></div>', "user-menu": '<div class="modal-user-menu"><h2>Minha Conta</h2></div>', "termos": '<div class="modal-termos"><h2>Termos de Uso</h2></div>', "privacidade": '<div class="modal-privacidade"><h2>Pol\xEDtica de Privacidade</h2></div>', "lgpd": '<div class="modal-lgpd"><h2>LGPD</h2></div>' };
function OverlayAdapterConstructor() {
  this._initialized = false;
  this._unsubs = [];
  this._metrics = { modalOpened: 0, overlayOpened: 0, delegated: 0, errors: 0 };
}
OverlayAdapterConstructor.prototype.init = function(context = {}) {
  const self = this;
  if (context === void 0) context = {};
  if (self._initialized) return self;
  self._setupListeners();
  self._initialized = true;
  self._track("overlay-adapter:init", { version: VERSION });
  return self;
};
OverlayAdapterConstructor.prototype._setupListeners = function() {
  const self = this;
  const eb = _getPort("eventBus");
  if (!eb || !eb.on) return;
  const unsubModal = eb.on(UI_EVENTS.MODAL_OPEN_REQUEST, (payload) => {
    self._handleModalOpen(payload);
  });
  if (typeof unsubModal === "function") self._unsubs.push(unsubModal);
  const unsubOverlay = eb.on(OVERLAY_INTENTS.OPEN, (payload) => {
    self._handleOverlayOpen(payload);
  });
  if (typeof unsubOverlay === "function") self._unsubs.push(unsubOverlay);
  const unsubResolved = eb.on(ORCHESTRATOR_EVENTS.INTENT_RESOLVED, (payload) => {
    self._handleIntentResolved(payload);
  });
  if (typeof unsubResolved === "function") self._unsubs.push(unsubResolved);
};
OverlayAdapterConstructor.prototype._handleModalOpen = function(payload) {
  const p = payload || {};
  const modalId = p.modalId;
  const source = p.source;
  const content = p.content;
  const config = p.config;
  if (!modalId) {
    this._metrics.errors++;
    return;
  }
  this._metrics.modalOpened++;
  const modalConfig = MODAL_CONFIGS[modalId] || { title: modalId, size: "md", closable: true };
  const finalConfig = Object.assign({}, modalConfig, config);
  this._openOverlay({ id: `modal-${modalId}`, type: "modal", content: content || this._getModalContent(modalId), config: finalConfig, source: source || MODULE_ID });
};
OverlayAdapterConstructor.prototype._handleOverlayOpen = function(payload) {
  const p = payload || {};
  const overlayId = p.overlayId;
  const type = p.type;
  const content = p.content;
  const config = p.config;
  const source = p.source;
  if (!overlayId) {
    this._metrics.errors++;
    return;
  }
  this._metrics.overlayOpened++;
  this._openOverlay({ id: `overlay-${overlayId}`, type: type || "drawer", content: content || null, config: config || {}, source: source || MODULE_ID });
};
OverlayAdapterConstructor.prototype._handleIntentResolved = function(payload) {
  const p = payload || {};
  const resolution = p.resolution;
  if (!resolution || !resolution.success) return;
  if (resolution.action === "openModal") {
    this._handleModalOpen({ modalId: resolution.target?.id ?? null, source: p.source });
  } else if (resolution.action === "openOverlay") {
    this._handleOverlayOpen({ overlayId: resolution.target?.id ?? null, source: p.source });
  }
};
OverlayAdapterConstructor.prototype._openOverlay = function(descriptor) {
  this._metrics.delegated++;
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(OVERLAY_INTENTS.OPEN, descriptor);
  this._track("overlay-adapter:delegated", { id: descriptor.id });
};
OverlayAdapterConstructor.prototype._getModalContent = function(modalId) {
  return MODAL_CONTENTS[modalId] || `<div class="modal-generic"><h2>${modalId}</h2></div>`;
};
OverlayAdapterConstructor.prototype._track = function(event, data = {}) {
  if (data === void 0) data = {};
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(TELEMETRY_INTENTS.TRACK, Object.assign({ event, source: MODULE_ID, timestamp: Date.now() }, data));
};
OverlayAdapterConstructor.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
OverlayAdapterConstructor.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, initialized: this._initialized, hasEvents: !!_getPort("eventBus"), listenedEvents: LISTENED_EVENTS, modalConfigs: Object.keys(MODAL_CONFIGS), metrics: this.getMetrics(), portsInitialized: Ports.isInitialized(), usingP18Intents: true, usingCatalogOverlayIntents: true };
};
OverlayAdapterConstructor.prototype.healthCheck = function() {
  const totalOps = this._metrics.modalOpened + this._metrics.overlayOpened;
  const checks = { initialized: this._initialized, hasEvents: !!_getPort("eventBus"), lowErrorRate: totalOps > 0 ? this._metrics.errors / totalOps < 0.1 : true, portsInitialized: Ports.isInitialized(), p18IntentsAvailable: true, catalogOverlayIntents: true };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed >= 5 ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/6`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() };
};
OverlayAdapterConstructor.prototype.destroy = function() {
  const self = this;
  self._unsubs.forEach((u) => {
    try {
      if (typeof u === "function") u();
    } catch (e) {
    }
  });
  self._unsubs = [];
  self._initialized = false;
};
OverlayAdapterConstructor.prototype.injectPorts = function(ports) {
  injectPorts(ports);
};
OverlayAdapterConstructor.prototype.getPorts = function() {
  return getPorts();
};
const OverlayAdapter = OverlayAdapterConstructor;
let _instance = null;
function getOverlayAdapter() {
  if (!_instance) _instance = new OverlayAdapter();
  return _instance;
}
function createOverlayAdapter(context = {}) {
  if (context === void 0) context = {};
  const adapter = new OverlayAdapter();
  adapter.init(context);
  return adapter;
}
var overlay_adapter_default = { OverlayAdapter, getOverlayAdapter, createOverlayAdapter, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  OverlayAdapter,
  VERSION,
  createOverlayAdapter,
  overlay_adapter_default as default,
  getOverlayAdapter,
  getPorts,
  injectPorts
};
