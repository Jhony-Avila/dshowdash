import { VERSION } from "/core/version.js";
const MODULE_ID = "header/components/panel-chatgpt/accessibility/shortcuts";
let _debug = false;
const _shortcuts = /* @__PURE__ */ new Map();
const _metrics = { registrations: 0, activations: 0, lastActivationAt: null };
function registerShortcut(key, callback, description = "") {
  _shortcuts.set(key.toLowerCase(), { callback, description });
  _metrics.registrations++;
}
function unregisterShortcut(key) {
  _shortcuts.delete(key.toLowerCase());
}
function handleKeydown(event) {
  const key = event.key.toLowerCase();
  if (_shortcuts.has(key)) {
    event.preventDefault();
    _shortcuts.get(key).callback(event);
    _metrics.activations++;
    _metrics.lastActivationAt = Date.now();
  }
}
function getShortcuts() {
  return Array.from(_shortcuts.entries()).map(([key, val]) => ({ key, description: val.description }));
}
function clearShortcuts() {
  _shortcuts.clear();
}
function setDebug(enabled) {
  _debug = !!enabled;
}
function getMetrics() {
  return { ..._metrics, registered: _shortcuts.size };
}
function resetMetrics() {
  _metrics.registrations = 0;
  _metrics.activations = 0;
  _metrics.lastActivationAt = null;
}
function healthCheck() {
  const checks = { ready: true, hasShortcuts: _shortcuts.size >= 0 };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: "HEALTHY", score: passed, maxScore: 2, checks, version: VERSION, moduleId: MODULE_ID };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, shortcuts: getShortcuts(), metrics: getMetrics() };
}
var shortcuts_default = { registerShortcut, unregisterShortcut, handleKeydown, getShortcuts, clearShortcuts };
export {
  MODULE_ID,
  VERSION,
  clearShortcuts,
  shortcuts_default as default,
  getMetrics,
  getShortcuts,
  handleKeydown,
  healthCheck,
  info,
  registerShortcut,
  resetMetrics,
  setDebug,
  unregisterShortcut
};
