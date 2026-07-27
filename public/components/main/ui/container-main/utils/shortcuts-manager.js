import { createLogger } from "./logger.js";
const VERSION = "1.1.0-LOGGER-INTEGRATED";
const MODULE_ID = "container-shortcuts-manager";
const logger = createLogger(MODULE_ID);
let _shortcuts = /* @__PURE__ */ new Map();
let _enabled = true;
let _keydownHandler = null;
let _injectedEventBus = null;
let _scope = "global";
function injectEventBus(eventBus) {
  _injectedEventBus = eventBus;
}
function _emitEvent(eventType, payload) {
  if (_injectedEventBus?.emit) {
    _injectedEventBus.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload });
  }
}
function _normalizeKey(key) {
  return key.toLowerCase().replace(/ctrl/i, "ctrl").replace(/alt/i, "alt").replace(/shift/i, "shift").replace(/meta|cmd|command/i, "meta").split("+").sort().join("+");
}
function _getKeyCombo(event) {
  const parts = [];
  if (event.ctrlKey) parts.push("ctrl");
  if (event.altKey) parts.push("alt");
  if (event.shiftKey) parts.push("shift");
  if (event.metaKey) parts.push("meta");
  const key = event.key.toLowerCase();
  if (!["control", "alt", "shift", "meta"].includes(key)) {
    parts.push(key);
  }
  return parts.sort().join("+");
}
function _handleKeydown(event) {
  if (!_enabled) return;
  const target = event.target;
  if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
    return;
  }
  const combo = _getKeyCombo(event);
  const shortcut = _shortcuts.get(combo);
  if (shortcut && (shortcut.scope === "global" || shortcut.scope === _scope)) {
    event.preventDefault();
    event.stopPropagation();
    try {
      shortcut.handler(event);
      _emitEvent("shortcut:triggered", { combo, description: shortcut.description });
    } catch (e) {
      logger.error("Error in handler", { combo, error: e.message });
    }
  }
}
function init() {
  if (_keydownHandler) return;
  _keydownHandler = _handleKeydown;
  document.addEventListener("keydown", _keydownHandler);
}
function register(key, handler, options = {}) {
  const { description = "", scope = "global", override = false } = options;
  const normalizedKey = _normalizeKey(key);
  if (_shortcuts.has(normalizedKey) && !override) {
    logger.warn("Shortcut already registered", { key });
    return false;
  }
  _shortcuts.set(normalizedKey, { handler, description, scope, key });
  return true;
}
function unregister(key) {
  const normalizedKey = _normalizeKey(key);
  return _shortcuts.delete(normalizedKey);
}
function has(key) {
  return _shortcuts.has(_normalizeKey(key));
}
function get(key) {
  return _shortcuts.get(_normalizeKey(key));
}
function getAll() {
  const all = [];
  _shortcuts.forEach((value, key) => {
    all.push({ combo: key, ...value });
  });
  return all;
}
function setScope(scope) {
  _scope = scope;
}
function getScope() {
  return _scope;
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
function clear() {
  const count = _shortcuts.size;
  _shortcuts.clear();
  return count;
}
function registerDefaults() {
  register("ctrl+s", (e) => _emitEvent("shortcut:save", {}), { description: "Salvar" });
  register("ctrl+z", (e) => _emitEvent("shortcut:undo", {}), { description: "Desfazer" });
  register("ctrl+shift+z", (e) => _emitEvent("shortcut:redo", {}), { description: "Refazer" });
  register("escape", (e) => _emitEvent("shortcut:escape", {}), { description: "Fechar/Cancelar" });
  register("ctrl+f", (e) => _emitEvent("shortcut:search", {}), { description: "Buscar" });
  register("f11", (e) => _emitEvent("shortcut:fullscreen", {}), { description: "Tela cheia" });
  register("ctrl+/", (e) => _emitEvent("shortcut:help", {}), { description: "Ajuda" });
}
function destroy() {
  if (_keydownHandler) {
    document.removeEventListener("keydown", _keydownHandler);
    _keydownHandler = null;
  }
  _shortcuts.clear();
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, shortcutCount: _shortcuts.size, enabled: _enabled, scope: _scope };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, shortcutCount: _shortcuts.size, enabled: _enabled };
}
var shortcuts_manager_default = {
  init,
  register,
  unregister,
  has,
  get,
  getAll,
  setScope,
  getScope,
  enable,
  disable,
  isEnabled,
  clear,
  registerDefaults,
  destroy,
  injectEventBus,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  clear,
  shortcuts_manager_default as default,
  destroy,
  disable,
  enable,
  get,
  getAll,
  getScope,
  has,
  healthCheck,
  info,
  init,
  injectEventBus,
  isEnabled,
  register,
  registerDefaults,
  setScope,
  unregister
};
