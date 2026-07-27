import { UI_INTENTS } from "/core/runtime/events/catalog/ui.events.js";
import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-permissions-admin.core.ports";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const initPorts = () => {
  Ports.init();
};
const getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const isInitialized = () => Ports.isInitialized();
const emit = (event, data = {}, moduleId) => {
  try {
    const eventBus = getPort("eventBus");
    if (eventBus?.emit) {
      eventBus.emit(event, { ...data, source: moduleId, timestamp: Date.now() });
    }
  } catch (e) {
  }
};
const showToast = (type, title, message) => {
  try {
    const eventBus = getPort("eventBus");
    if (eventBus?.emit) {
      eventBus.emit(UI_INTENTS.SHOW_TOAST, { type, title, message, duration: 4e3, source: MODULE_ID, timestamp: Date.now() });
    }
  } catch (e) {
  }
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION, initialized: Ports.isInitialized() });
const healthCheck = () => ({ status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), timestamp: Date.now() });
var ports_default = { initPorts, getPort, injectPorts, getPorts, isInitialized, emit, showToast, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  ports_default as default,
  emit,
  getPort,
  getPorts,
  healthCheck,
  info,
  initPorts,
  injectPorts,
  isInitialized,
  showToast
};
