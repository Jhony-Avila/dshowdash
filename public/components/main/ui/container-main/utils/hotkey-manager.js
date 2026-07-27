import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE6";
const MODULE_ID = "container-main:hotkey-manager";
const MODIFIERS = Object.freeze({ CTRL: "ctrl", ALT: "alt", SHIFT: "shift", META: "meta" });
const SCOPES = Object.freeze({ GLOBAL: "global", INPUT: "input", MODAL: "modal" });
function createHotkeyManager(options = {}) {
  const { preventDefault = true, stopPropagation = true, enableInInputs = false, debug = false } = options;
  const _logger = createLogger(MODULE_ID);
  const _hotkeys = /* @__PURE__ */ new Map();
  const _scopes = /* @__PURE__ */ new Set([SCOPES.GLOBAL]);
  let _enabled = true;
  let _counter = 0;
  let _metrics = { triggered: 0, blocked: 0 };
  function _normalizeKey(key) {
    return key.toLowerCase().replace("control", "ctrl").replace("command", "meta").replace("option", "alt").replace("escape", "esc").replace("arrowup", "up").replace("arrowdown", "down").replace("arrowleft", "left").replace("arrowright", "right").replace(" ", "space");
  }
  function _parseCombo(combo) {
    const parts = combo.toLowerCase().split("+").map((p) => p.trim());
    const modifiers = { ctrl: false, alt: false, shift: false, meta: false };
    let key = "";
    for (const part of parts) {
      if (part === "ctrl" || part === "control") modifiers.ctrl = true;
      else if (part === "alt" || part === "option") modifiers.alt = true;
      else if (part === "shift") modifiers.shift = true;
      else if (part === "meta" || part === "cmd" || part === "command") modifiers.meta = true;
      else key = _normalizeKey(part);
    }
    return { modifiers, key, combo: `${modifiers.ctrl ? "ctrl+" : ""}${modifiers.alt ? "alt+" : ""}${modifiers.shift ? "shift+" : ""}${modifiers.meta ? "meta+" : ""}${key}` };
  }
  function _matchesModifiers(e, modifiers) {
    return e.ctrlKey === modifiers.ctrl && e.altKey === modifiers.alt && e.shiftKey === modifiers.shift && e.metaKey === modifiers.meta;
  }
  function _isInputElement(el) {
    const tagName = el?.tagName?.toLowerCase();
    return tagName === "input" || tagName === "textarea" || tagName === "select" || el?.isContentEditable;
  }
  function _handleKeydown(e) {
    if (!_enabled) return;
    const key = _normalizeKey(e.key);
    const isInput = _isInputElement(e.target);
    for (const [id, config] of _hotkeys) {
      if (config.key !== key) continue;
      if (!_matchesModifiers(e, config.modifiers)) continue;
      if (!_scopes.has(config.scope) && config.scope !== SCOPES.GLOBAL) continue;
      if (isInput && !config.enableInInputs && !enableInInputs) {
        _metrics.blocked++;
        continue;
      }
      if (config.disabled) continue;
      if (debug) _logger.debug(`Hotkey triggered: ${config.combo}`);
      if (config.preventDefault ?? preventDefault) e.preventDefault();
      if (config.stopPropagation ?? stopPropagation) e.stopPropagation();
      try {
        config.handler(e, config);
        _metrics.triggered++;
      } catch (err) {
        _logger.error(`Hotkey error [${config.combo}]:`, err);
      }
      if (!config.allowMultiple) break;
    }
  }
  document.addEventListener("keydown", _handleKeydown);
  const manager = {
    register(combo, handler, options2 = {}) {
      const parsed = _parseCombo(combo);
      const id = options2.id || `hk-${++_counter}`;
      const config = {
        id,
        combo: parsed.combo,
        key: parsed.key,
        modifiers: parsed.modifiers,
        handler,
        scope: options2.scope || SCOPES.GLOBAL,
        description: options2.description || "",
        enableInInputs: options2.enableInInputs || false,
        preventDefault: options2.preventDefault,
        stopPropagation: options2.stopPropagation,
        allowMultiple: options2.allowMultiple || false,
        disabled: false
      };
      _hotkeys.set(id, config);
      return id;
    },
    unregister(id) {
      return _hotkeys.delete(id);
    },
    enable(id) {
      const hk = _hotkeys.get(id);
      if (hk) hk.disabled = false;
    },
    disable(id) {
      const hk = _hotkeys.get(id);
      if (hk) hk.disabled = true;
    },
    enableAll() {
      _enabled = true;
    },
    disableAll() {
      _enabled = false;
    },
    setScope(scope) {
      _scopes.clear();
      _scopes.add(SCOPES.GLOBAL);
      if (scope !== SCOPES.GLOBAL) _scopes.add(scope);
    },
    // @ts-expect-error TS migration - TS2345
    addScope(scope) {
      _scopes.add(scope);
    },
    // @ts-expect-error TS migration - TS2345
    removeScope(scope) {
      if (scope !== SCOPES.GLOBAL) _scopes.delete(scope);
    },
    getScopes() {
      return [..._scopes];
    },
    list() {
      return Array.from(_hotkeys.values()).map((h) => ({
        id: h.id,
        combo: h.combo,
        description: h.description,
        scope: h.scope,
        disabled: h.disabled
      }));
    },
    getByCombo(combo) {
      const parsed = _parseCombo(combo);
      return Array.from(_hotkeys.values()).filter((h) => h.combo === parsed.combo);
    },
    trigger(combo) {
      const parsed = _parseCombo(combo);
      for (const [id, config] of _hotkeys) {
        if (config.combo === parsed.combo && !config.disabled) {
          config.handler(null, config);
          _metrics.triggered++;
          return true;
        }
      }
      return false;
    },
    getMetrics() {
      return { ..._metrics, registered: _hotkeys.size, scopes: [..._scopes] };
    },
    resetMetrics() {
      _metrics = { triggered: 0, blocked: 0 };
    },
    healthCheck() {
      return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, registered: _hotkeys.size, enabled: _enabled, metrics: _metrics };
    },
    info() {
      return { moduleId: MODULE_ID, version: VERSION, registered: _hotkeys.size, enabled: _enabled, scopes: [..._scopes], modifiers: Object.keys(MODIFIERS) };
    },
    destroy() {
      document.removeEventListener("keydown", _handleKeydown);
      _hotkeys.clear();
      _scopes.clear();
    }
  };
  return manager;
}
let _instance = null;
function getHotkeyManager(options = {}) {
  if (!_instance) _instance = createHotkeyManager(options);
  return _instance;
}
function resetHotkeyManager() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function registerHotkey(combo, handler, options) {
  return getHotkeyManager().register(combo, handler, options);
}
function unregisterHotkey(id) {
  return getHotkeyManager().unregister(id);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, modifiers: Object.keys(MODIFIERS), scopes: Object.keys(SCOPES) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var hotkey_manager_default = { VERSION, MODULE_ID, MODIFIERS, SCOPES, createHotkeyManager, getHotkeyManager, resetHotkeyManager, registerHotkey, unregisterHotkey, info, healthCheck };
export {
  MODIFIERS,
  MODULE_ID,
  SCOPES,
  VERSION,
  createHotkeyManager,
  hotkey_manager_default as default,
  getHotkeyManager,
  healthCheck,
  info,
  registerHotkey,
  resetHotkeyManager,
  unregisterHotkey
};
