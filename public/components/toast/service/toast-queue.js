import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
import { CONFIG } from "./config.js";
import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
const VERSION = "1.6.0-P2-ENTERPRISE";
const MODULE_ID = "toast-queue";
const hasWindow = typeof window !== "undefined";
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
let _queue = [];
let _visible = [];
let _counter = 0;
function _emitToEventBus(toast) {
  _initPorts();
  try {
    const eb = _getPort("eventBus");
    if (eb && eb.emit) {
      eb.emit(UI_EVENTS.TOAST_SHOW, Object.assign({}, toast, { source: MODULE_ID, timestamp: Date.now() }));
    }
  } catch (e) {
  }
}
function generateId() {
  return `toast-${++_counter}-${Date.now().toString(36)}`;
}
function addToQueue(toast) {
  _queue.push(toast);
  processQueue();
}
function removeFromVisible(id) {
  _visible = _visible.filter((t) => t.id !== id);
  processQueue();
}
function processQueue() {
  while (_visible.length < CONFIG.maxVisible && _queue.length > 0) {
    const toast = _queue.shift();
    if (toast) {
      _visible.push(toast);
      _emitToEventBus(toast);
    }
  }
}
function getQueue() {
  return _queue.slice();
}
function getVisible() {
  return _visible.slice();
}
function clearAll() {
  _queue = [];
  const ids = _visible.map((t) => t.id);
  _visible = [];
  return ids;
}
function findById(id) {
  for (let i = 0; i < _visible.length; i++) {
    if (_visible[i].id === id) return _visible[i];
  }
  for (let j = 0; j < _queue.length; j++) {
    if (_queue[j].id === id) return _queue[j];
  }
  return null;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, p03PortsOnly: true, portsInitialized: Ports.isInitialized(), strictMode: isStrict(), strictModeCompliant: true };
}
function healthCheck() {
  const hasEventBus = !!_getPort("eventBus");
  return {
    status: hasEventBus ? "HEALTHY" : "DEGRADED",
    moduleId: MODULE_ID,
    version: VERSION,
    p03PortsOnly: true,
    strictMode: isStrict(),
    strictModeCompliant: true,
    checks: { ready: true, hasEventBus, portsInitialized: Ports.isInitialized() }
  };
}
const ToastQueue = {
  generateId,
  addToQueue,
  removeFromVisible,
  processQueue,
  getQueue,
  getVisible,
  clearAll,
  findById,
  VERSION,
  MODULE_ID,
  info,
  healthCheck,
  injectPorts,
  getPorts
};
if (hasWindow) {
  if (typeof window.__DEVTOOLS__ !== "undefined") {
    window.__DEVTOOLS__.ToastQueue = ToastQueue;
  }
}
var toast_queue_default = ToastQueue;
export {
  MODULE_ID,
  VERSION,
  addToQueue,
  clearAll,
  toast_queue_default as default,
  findById,
  generateId,
  getPorts,
  getQueue,
  getVisible,
  healthCheck,
  info,
  injectPorts,
  processQueue,
  removeFromVisible
};
