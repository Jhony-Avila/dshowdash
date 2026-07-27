const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/_shared/accessibility/shortcuts";
const _shortcuts = /* @__PURE__ */ new Map();
let _enabled = true;
let _handler = null;
let _abortController = null;
function parseKey(key) {
  const parts = key.toLowerCase().split("+");
  return {
    ctrl: parts.includes("ctrl"),
    alt: parts.includes("alt"),
    shift: parts.includes("shift"),
    meta: parts.includes("meta"),
    key: parts.find((p) => !["ctrl", "alt", "shift", "meta"].includes(p)) || ""
  };
}
function matchEvent(event, parsed) {
  return event.ctrlKey === parsed.ctrl && event.altKey === parsed.alt && event.shiftKey === parsed.shift && event.metaKey === parsed.meta && event.key.toLowerCase() === parsed.key;
}
function handleKeydown(event) {
  if (!_enabled) return;
  for (const [key, { callback, parsed, options }] of _shortcuts) {
    if (matchEvent(event, parsed)) {
      if (options.preventDefault !== false) event.preventDefault();
      if (options.stopPropagation) event.stopPropagation();
      callback(event);
      return;
    }
  }
}
function register(key, callback, options = {}) {
  const parsed = parseKey(key);
  _shortcuts.set(key, { callback, parsed, options });
  if (!_handler) {
    _handler = handleKeydown;
    _abortController = new AbortController();
    document.addEventListener("keydown", _handler, { signal: _abortController.signal });
  }
  return () => unregister(key);
}
function unregister(key) {
  _shortcuts.delete(key);
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
function getRegistered() {
  return Array.from(_shortcuts.keys());
}
function destroy() {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
  }
  _handler = null;
  _shortcuts.clear();
}
function healthCheck() {
  return { status: "HEALTHY", enabled: _enabled, shortcutCount: _shortcuts.size, version: VERSION, moduleId: MODULE_ID };
}
var shortcuts_default = { register, unregister, enable, disable, isEnabled, getRegistered, destroy, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  shortcuts_default as default,
  destroy,
  disable,
  enable,
  getRegistered,
  healthCheck,
  isEnabled,
  register,
  unregister
};
