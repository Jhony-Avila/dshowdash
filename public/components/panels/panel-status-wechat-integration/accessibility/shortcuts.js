const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-status-wechat-integration/accessibility/shortcuts";
const _shortcuts = /* @__PURE__ */ new Map();
let _enabled = true;
function register(key, callback, description = "") {
  _shortcuts.set(key.toLowerCase(), { callback, description });
}
function unregister(key) {
  _shortcuts.delete(key.toLowerCase());
}
function handleKeydown(event) {
  if (!_enabled) return;
  const key = [];
  if (event.ctrlKey) key.push("ctrl");
  if (event.altKey) key.push("alt");
  if (event.shiftKey) key.push("shift");
  key.push(event.key.toLowerCase());
  const combo = key.join("+");
  const shortcut = _shortcuts.get(combo);
  if (shortcut) {
    event.preventDefault();
    shortcut.callback(event);
  }
}
function enable() {
  _enabled = true;
}
function disable() {
  _enabled = false;
}
function isEnabled() {
  return _enabled;
}
function getShortcuts() {
  return Array.from(_shortcuts.entries());
}
function healthCheck() {
  return { status: "healthy", version: VERSION, moduleId: MODULE_ID, enabled: _enabled, shortcutCount: _shortcuts.size };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, enabled: _enabled, shortcuts: getShortcuts(), healthCheck: healthCheck() };
}
var shortcuts_default = { register, unregister, handleKeydown, enable, disable, isEnabled, getShortcuts, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  shortcuts_default as default,
  disable,
  enable,
  getShortcuts,
  handleKeydown,
  healthCheck,
  info,
  isEnabled,
  register,
  unregister
};
