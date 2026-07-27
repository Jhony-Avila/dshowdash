import { getGlobalShortcuts, incrementMetric } from "../state.js";
import { _emit } from "../helpers/logger.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.keyboard-navigation-manager.shortcuts.manager";
function _getShortcutKey(e) {
  const parts = [];
  if (e.ctrlKey) parts.push("ctrl");
  if (e.altKey) parts.push("alt");
  if (e.shiftKey) parts.push("shift");
  if (e.metaKey) parts.push("meta");
  parts.push(e.key.toLowerCase());
  return parts.join("+");
}
function _handleGlobalKeyDown(e) {
  incrementMetric("keyPresses");
  const shortcutKey = _getShortcutKey(e);
  const shortcuts = getGlobalShortcuts();
  if (shortcuts.has(shortcutKey)) {
    const shortcut = shortcuts.get(shortcutKey);
    if (!shortcut.disabled) {
      e.preventDefault();
      shortcut.handler(e);
      incrementMetric("shortcutsTriggered");
      _emit("shortcutTriggered", { key: shortcutKey });
      return;
    }
  }
}
function registerShortcut(shortcut, handler, options = {}) {
  const key = shortcut.toLowerCase();
  getGlobalShortcuts().set(key, {
    handler,
    description: options.description || "",
    disabled: false,
    scope: options.scope || "global"
  });
  _emit("shortcutRegistered", { shortcut: key });
  return true;
}
function unregisterShortcut(shortcut) {
  const key = shortcut.toLowerCase();
  const result = getGlobalShortcuts().delete(key);
  if (result) {
    _emit("shortcutUnregistered", { shortcut: key });
  }
  return result;
}
function getShortcuts() {
  const shortcuts = [];
  getGlobalShortcuts().forEach((value, key) => {
    shortcuts.push({
      shortcut: key,
      description: value.description,
      disabled: value.disabled,
      scope: value.scope
    });
  });
  return shortcuts;
}
function enableShortcut(shortcut) {
  const key = shortcut.toLowerCase();
  const entry = getGlobalShortcuts().get(key);
  if (entry) {
    entry.disabled = false;
    return true;
  }
  return false;
}
function disableShortcut(shortcut) {
  const key = shortcut.toLowerCase();
  const entry = getGlobalShortcuts().get(key);
  if (entry) {
    entry.disabled = true;
    return true;
  }
  return false;
}
export {
  MODULE_ID,
  VERSION,
  _getShortcutKey,
  _handleGlobalKeyDown,
  disableShortcut,
  enableShortcut,
  getShortcuts,
  registerShortcut,
  unregisterShortcut
};
