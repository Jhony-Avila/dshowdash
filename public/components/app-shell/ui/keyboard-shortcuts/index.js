import { VERSION, MODULE_ID, MODIFIER_KEYS, SHORTCUT_SCOPES } from "./constants.js";
import {
  isEnabled as _isEnabled,
  setEnabled as _setEnabled,
  getConfig as _getConfig,
  updateConfig,
  getSubscribers,
  resetState
} from "./state.js";
import {
  register as _register,
  unregister,
  unregisterGroup,
  registerMany as _registerMany,
  get,
  getAll,
  getByGroup,
  getGroupList,
  isRegistered,
  setShortcutEnabled
} from "./core/registration.js";
import {
  setScope as _setScope,
  restoreScope,
  getScope
} from "./core/scope.js";
import {
  trigger,
  initKeyboardListener,
  removeKeyboardListener
} from "./core/trigger.js";
import {
  showHelp,
  hideHelp
} from "./ui/help-panel.js";
import {
  getMetrics,
  healthCheck,
  info
} from "./diagnostics/health.js";
function _notifySubscribers(event) {
  const subscribers = getSubscribers();
  for (let i = 0; i < subscribers.length; i++) {
    try {
      subscribers[i](event);
    } catch (e) {
    }
  }
}
function register(combo, handler, options) {
  const result = _register(Object.assign({ combo, handler }, options));
  _notifySubscribers({ type: "register", combo });
  return result;
}
function registerMany(shortcuts) {
  const result = _registerMany(shortcuts);
  _notifySubscribers({ type: "registerMany", count: shortcuts.length });
  return result;
}
function setScope(scope) {
  return _setScope(scope, _notifySubscribers);
}
function enable() {
  _setEnabled(true);
}
function disable() {
  _setEnabled(false);
}
function isEnabled() {
  return _isEnabled();
}
function setEnabled(combo, enabled) {
  return setShortcutEnabled(combo, enabled);
}
function configure(options) {
  updateConfig(options);
}
function getConfig() {
  return Object.assign({}, _getConfig());
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  const subscribers = getSubscribers();
  subscribers.push(callback);
  return () => {
    const idx = subscribers.indexOf(callback);
    if (idx >= 0) subscribers.splice(idx, 1);
  };
}
function destroy() {
  removeKeyboardListener();
  hideHelp();
  resetState();
}
function getGroups() {
  return getGroupList();
}
const SCOPES = SHORTCUT_SCOPES;
if (typeof document !== "undefined") {
  initKeyboardListener();
  const config = _getConfig();
  if (config.showHelp && config.helpKey) {
    register(config.helpKey, showHelp, {
      description: "Mostrar atalhos de teclado",
      group: "system",
      allowInInputs: false
    });
  }
}
var keyboard_shortcuts_default = {
  VERSION,
  MODULE_ID,
  MODIFIER_KEYS,
  SCOPES: SHORTCUT_SCOPES,
  // Registration
  register,
  unregister,
  unregisterGroup,
  registerMany,
  // Scope
  setScope,
  restoreScope,
  getScope,
  // Enable/Disable
  enable,
  disable,
  isEnabled,
  setEnabled,
  // Queries
  get,
  getAll,
  getByGroup,
  getGroups,
  isRegistered,
  // Trigger
  trigger,
  // Help
  showHelp,
  hideHelp,
  // Config
  configure,
  getConfig,
  // Subscription
  subscribe,
  // Lifecycle
  destroy,
  // Health
  getMetrics,
  healthCheck,
  info
};
export {
  MODIFIER_KEYS,
  MODULE_ID,
  SCOPES,
  SHORTCUT_SCOPES,
  VERSION,
  configure,
  keyboard_shortcuts_default as default,
  destroy,
  disable,
  enable,
  get,
  getAll,
  getByGroup,
  getConfig,
  getGroups,
  getMetrics,
  getScope,
  healthCheck,
  hideHelp,
  info,
  isEnabled,
  isRegistered,
  register,
  registerMany,
  restoreScope,
  setEnabled,
  setScope,
  showHelp,
  subscribe,
  trigger,
  unregister,
  unregisterGroup
};
