import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
import { TOAST_EVENTS as _TOAST_EVENTS } from "/components/toast/toast-catalog.js";
const TOAST_EVENTS = _TOAST_EVENTS;
import * as Manager from "../core/manager.js";
const VERSION = "1.4.0-P21";
const MODULE_ID = "overlay-layer.adapters.toast-adapter";
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
const TOAST_BASE_ID = "toast";
const TOAST_PRIORITY = 6e3;
let _toastQueue = [];
const _activeToasts = /* @__PURE__ */ new Map();
const _config = { maxVisible: 5, defaultDuration: 5e3, position: "top-right", stackDirection: "down" };
let _metrics = { shown: 0, dismissed: 0, queued: 0 };
let _cleanups = [];
function _generateId() {
  return `${TOAST_BASE_ID}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function show(message, type, options) {
  if (!type) type = "info";
  if (!options) options = {};
  const id = options.id || _generateId();
  const duration = options.duration !== void 0 ? options.duration : _config.defaultDuration;
  if (_activeToasts.size >= _config.maxVisible) {
    _toastQueue.push({ id, message, type, options, enqueuedAt: Date.now() });
    _metrics.queued++;
    return { ok: true, id, queued: true, position: _toastQueue.length };
  }
  const result = Manager.open({ id, type: "toast", priority: TOAST_PRIORITY, blocking: false, content: { message, type }, config: { closable: options.closable !== false, duration, position: options.position || _config.position, action: options.action || null } });
  if (result.ok) {
    _activeToasts.set(id, { message, type, showedAt: Date.now(), duration });
    _metrics.shown++;
    if (duration > 0) setTimeout(() => {
      dismiss(id, "timeout");
    }, duration);
  }
  return { ok: result.ok, id, action: result.action };
}
function success(message, options) {
  return show(message, "success", options);
}
function error(message, options) {
  if (!options) options = {};
  options.duration = options.duration || 8e3;
  return show(message, "error", options);
}
function warning(message, options) {
  return show(message, "warning", options);
}
function toastInfo(message, options) {
  return show(message, "info", options);
}
function dismiss(id, reason) {
  if (!reason) reason = "explicit";
  if (!_activeToasts.has(id)) return { ok: false, reason: "not-found" };
  const result = Manager.close(id, reason);
  _activeToasts.delete(id);
  _metrics.dismissed++;
  _processQueue();
  return result;
}
function dismissAll(reason) {
  if (!reason) reason = "dismiss-all";
  const count = _activeToasts.size;
  _activeToasts.forEach((_, id) => {
    Manager.close(id, reason);
  });
  _activeToasts.clear();
  _metrics.dismissed += count;
  return { ok: true, dismissed: count };
}
function _processQueue() {
  if (_toastQueue.length === 0 || _activeToasts.size >= _config.maxVisible) return;
  const next = _toastQueue.shift();
  if (next) show(next.message, next.type, next.options);
}
function update(id, message, type) {
  if (!_activeToasts.has(id)) return { ok: false, reason: "not-found" };
  const toast = _activeToasts.get(id);
  toast.message = message;
  if (type) toast.type = type;
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(UI_EVENTS.TOAST_UPDATE, { id, message, type });
  return { ok: true, id };
}
function _showHandler(data) {
  show(data.message, data.type, data.options);
}
function _dismissHandler(data) {
  dismiss(data.id, data.reason);
}
function _dismissAllHandler() {
  dismissAll();
}
function connectToToastService() {
  const eb = _getPort("eventBus");
  if (!eb || !eb.on) return { ok: false, reason: "EventBus not available" };
  const c1 = eb.on(TOAST_EVENTS.SHOW, _showHandler);
  if (typeof c1 === "function") _cleanups.push(c1);
  else _cleanups.push(() => {
    if (eb.off) eb.off(TOAST_EVENTS.SHOW, _showHandler);
  });
  const c2 = eb.on(TOAST_EVENTS.DISMISS, _dismissHandler);
  if (typeof c2 === "function") _cleanups.push(c2);
  else _cleanups.push(() => {
    if (eb.off) eb.off(TOAST_EVENTS.DISMISS, _dismissHandler);
  });
  const c3 = eb.on(TOAST_EVENTS.DISMISS_ALL, _dismissAllHandler);
  if (typeof c3 === "function") _cleanups.push(c3);
  else _cleanups.push(() => {
    if (eb.off) eb.off(TOAST_EVENTS.DISMISS_ALL, _dismissAllHandler);
  });
  return { ok: true, connected: true };
}
function disconnect() {
  _cleanups.forEach((fn) => {
    try {
      fn();
    } catch (e) {
    }
  });
  _cleanups = [];
  return { ok: true };
}
function destroy() {
  disconnect();
  dismissAll("destroy");
  _toastQueue = [];
  _metrics = { shown: 0, dismissed: 0, queued: 0 };
}
function isActive(id) {
  return _activeToasts.has(id);
}
function getActiveToasts() {
  const list = [];
  _activeToasts.forEach((data, id) => {
    list.push(Object.assign({ id, age: Date.now() - data.showedAt }, data));
  });
  return list;
}
function getConfig() {
  return Object.assign({}, _config);
}
function setConfig(newConfig) {
  if (newConfig.maxVisible) _config.maxVisible = newConfig.maxVisible;
  if (newConfig.defaultDuration !== void 0) _config.defaultDuration = newConfig.defaultDuration;
  if (newConfig.position) _config.position = newConfig.position;
  if (newConfig.stackDirection) _config.stackDirection = newConfig.stackDirection;
  return { ok: true, config: Object.assign({}, _config) };
}
function getMetrics() {
  return Object.assign({}, _metrics, { active: _activeToasts.size, queued: _toastQueue.length });
}
function healthCheck() {
  const eb = _getPort("eventBus");
  const checks = { managerAvailable: !!Manager, queueNotOverflowing: _toastQueue.length < 20, activeWithinLimit: _activeToasts.size <= _config.maxVisible, eventBusAvailable: !!eb, portsInitialized: Ports.isInitialized() };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  return { status: passed === keys.length ? "HEALTHY" : "DEGRADED", score: `${passed}/${keys.length}`, checks, metrics: getMetrics(), portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, p21Compliant: true, cleanups: _cleanups.length, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, config: getConfig(), activeToasts: getActiveToasts(), queueSize: _toastQueue.length, metrics: getMetrics(), portsInitialized: Ports.isInitialized(), p21Compliant: true, timestamp: Date.now() };
}
var toast_adapter_default = { show, success, error, warning, info: toastInfo, dismiss, dismissAll, update, connectToToastService, disconnect, destroy, isActive, getActiveToasts, getConfig, setConfig, getMetrics, healthCheck, moduleInfo: info, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  connectToToastService,
  toast_adapter_default as default,
  destroy,
  disconnect,
  dismiss,
  dismissAll,
  error,
  getActiveToasts,
  getConfig,
  getMetrics,
  getPorts,
  healthCheck,
  toastInfo as info,
  injectPorts,
  isActive,
  setConfig,
  show,
  success,
  update,
  warning
};
