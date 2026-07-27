import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "2.5.0-P18EC";
const MODULE_ID = "ui-orchestrator.adapters.keyboard-adapter";
const OVERLAY_EVENTS = { CLOSE: "overlay:close", CLOSE_REQUEST: "overlay:close-request" };
const KEYBOARD_EVENTS = { READY: "ui-orchestrator:keyboard-adapter:ready", SHORTCUT_EXECUTED: "ui-orchestrator:keyboard:shortcut-executed", CUSTOM_EXECUTED: "ui-orchestrator:keyboard:custom-executed" };
const hasWindow = typeof window !== "undefined";
const hasDocument = typeof document !== "undefined";
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
const _log = function(level) {
  const args = Array.prototype.slice.call(arguments, 1);
  const logger = _getPort("logger");
  if (!logger) return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn.apply(logger, [`[${MODULE_ID}]`].concat(args));
};
let _enabled = true;
let _listening = false;
const _customShortcuts = /* @__PURE__ */ new Map();
let _metrics = { keystrokes: 0, shortcutsMatched: 0, shortcutsExecuted: 0, shortcutsDenied: 0, errors: 0 };
const DEFAULT_SHORTCUTS = { "ctrl+k": { intentId: "keyboard.shortcut.search", label: "Buscar" }, "f1": { intentId: "keyboard.shortcut.help", label: "Ajuda" }, "alt+h": { intentId: "keyboard.shortcut.home", label: "Home" }, "ctrl+b": { intentId: "keyboard.shortcut.sidebar", label: "Toggle Sidebar" }, "ctrl+shift+f": { intentId: "system.action.fullscreen", label: "Fullscreen" }, "ctrl+shift+r": { intentId: "system.action.refresh", label: "Refresh" }, "ctrl+shift+t": { intentId: "system.toggle.theme", label: "Toggle Theme" }, "escape": { intentId: null, action: "close-overlay", label: "Fechar" } };
function init(options = {}) {
  if (options === void 0) options = {};
  _enabled = options.enabled !== false;
  if (_enabled && !_listening) _startListening();
  _emitEvent(KEYBOARD_EVENTS.READY, { version: VERSION });
  return { success: true, listening: _listening, portsInitialized: Ports.isInitialized() };
}
function destroy() {
  _stopListening();
  _customShortcuts.clear();
}
function _startListening() {
  if (_listening || !hasDocument) return;
  document.addEventListener("keydown", _handleKeydown, { capture: true });
  _listening = true;
}
function _stopListening() {
  if (!_listening || !hasDocument) return;
  document.removeEventListener("keydown", _handleKeydown, { capture: true });
  _listening = false;
}
function _handleKeydown(event) {
  if (!_enabled) return;
  const target = event.target;
  const tagName = target && target.tagName ? target.tagName.toLowerCase() : "";
  if (tagName === "input" || tagName === "textarea" || target && target.isContentEditable) {
    if (event.key !== "Escape") return;
  }
  _metrics.keystrokes++;
  try {
    const shortcutKey = _normalizeShortcut(event);
    if (_customShortcuts.has(shortcutKey)) {
      event.preventDefault();
      _executeCustomShortcut(shortcutKey);
      return;
    }
    const defaultShortcut = DEFAULT_SHORTCUTS[shortcutKey];
    if (defaultShortcut) {
      event.preventDefault();
      _executeDefaultShortcut(defaultShortcut, shortcutKey);
      return;
    }
  } catch (error) {
    _metrics.errors++;
    _log("warn", "Error handling shortcut:", error);
  }
}
function _normalizeShortcut(event) {
  const parts = [];
  if (event.ctrlKey || event.metaKey) parts.push("ctrl");
  if (event.altKey) parts.push("alt");
  if (event.shiftKey) parts.push("shift");
  parts.push(event.key.toLowerCase());
  return parts.join("+");
}
function _executeDefaultShortcut(shortcut, shortcutKey) {
  _metrics.shortcutsMatched++;
  const eb = _getPort("eventBus");
  if (shortcut.action === "close-overlay") {
    _emitEvent(OVERLAY_EVENTS.CLOSE_REQUEST, { source: "keyboard" });
    if (eb && eb.emit) eb.emit(OVERLAY_EVENTS.CLOSE, { source: "keyboard" });
    _metrics.shortcutsExecuted++;
    return;
  }
  _metrics.shortcutsExecuted++;
  _emitEvent(KEYBOARD_EVENTS.SHORTCUT_EXECUTED, { shortcut: shortcutKey, intentId: shortcut.intentId });
}
function _executeCustomShortcut(shortcutKey) {
  _metrics.shortcutsMatched++;
  const custom = _customShortcuts.get(shortcutKey);
  if (custom && custom.callback) {
    try {
      custom.callback({ shortcut: shortcutKey });
      _metrics.shortcutsExecuted++;
      _emitEvent(KEYBOARD_EVENTS.CUSTOM_EXECUTED, { shortcut: shortcutKey, label: custom.label });
    } catch (error) {
      _metrics.errors++;
    }
  }
}
function register(shortcut, callback, label = "") {
  if (label === void 0) label = "";
  const normalized = shortcut.toLowerCase().replace(/\s+/g, "");
  _customShortcuts.set(normalized, { callback, label });
  return () => unregister(shortcut);
}
function unregister(shortcut) {
  const normalized = shortcut.toLowerCase().replace(/\s+/g, "");
  return _customShortcuts.delete(normalized);
}
function listShortcuts() {
  const shortcuts = [];
  _customShortcuts.forEach((config, key) => {
    shortcuts.push({ shortcut: key, label: config.label, source: "custom" });
  });
  Object.keys(DEFAULT_SHORTCUTS).forEach((key) => {
    const config = DEFAULT_SHORTCUTS[key];
    if (!shortcuts.find((s) => s.shortcut === key)) {
      shortcuts.push({ shortcut: key, label: config.label, intentId: config.intentId, source: "default" });
    }
  });
  return shortcuts;
}
function enable() {
  _enabled = true;
  if (!_listening) _startListening();
}
function disable() {
  _enabled = false;
}
function isEnabled() {
  return _enabled;
}
function isListening() {
  return _listening;
}
function simulate(shortcut) {
  const normalized = shortcut.toLowerCase().replace(/\s+/g, "");
  if (_customShortcuts.has(normalized)) {
    _executeCustomShortcut(normalized);
    return Promise.resolve({ executed: true, source: "custom" });
  }
  const defaultShortcut = DEFAULT_SHORTCUTS[normalized];
  if (defaultShortcut) {
    _executeDefaultShortcut(defaultShortcut, normalized);
    return Promise.resolve({ executed: true, source: "default", intentId: defaultShortcut.intentId });
  }
  return Promise.resolve({ executed: false, reason: "no-matching-shortcut" });
}
function _emitEvent(eventKey, data = {}) {
  if (data === void 0) data = {};
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(eventKey, Object.assign({}, data, { source: MODULE_ID, timestamp: Date.now() }));
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function resetMetrics() {
  _metrics = { keystrokes: 0, shortcutsMatched: 0, shortcutsExecuted: 0, shortcutsDenied: 0, errors: 0 };
}
function info() {
  const logger = _getPort("logger");
  return { moduleId: MODULE_ID, version: VERSION, enabled: _enabled, listening: _listening, customShortcutsCount: _customShortcuts.size, defaultShortcutsCount: Object.keys(DEFAULT_SHORTCUTS).length, allShortcuts: listShortcuts(), metrics: getMetrics(), loggerReady: !!logger, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  const logger = _getPort("logger");
  const checks = { enabled: _enabled, listening: _listening, lowErrors: _metrics.errors < 5, executionRate: _metrics.shortcutsMatched > 0 ? _metrics.shortcutsExecuted / _metrics.shortcutsMatched > 0.5 : true, loggerReady: !!logger, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed >= 4 ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/${total}`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
}
var keyboard_adapter_default = { init, destroy, register, unregister, listShortcuts, enable, disable, isEnabled, isListening, simulate, getMetrics, resetMetrics, info, healthCheck, OVERLAY_EVENTS, KEYBOARD_EVENTS, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  KEYBOARD_EVENTS,
  MODULE_ID,
  OVERLAY_EVENTS,
  VERSION,
  keyboard_adapter_default as default,
  destroy,
  disable,
  enable,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  isEnabled,
  isListening,
  listShortcuts,
  register,
  resetMetrics,
  simulate,
  unregister
};
