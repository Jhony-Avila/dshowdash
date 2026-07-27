import { SHORTCUT_SCOPES } from "../constants.js";
import {
  getShortcuts,
  getActiveScope,
  isEnabled,
  getConfig,
  getLastCombo,
  setLastCombo,
  incrementMetric,
  getSubscribers
} from "../state.js";
import { parseCombo, comboToString, eventToCombo, matchesCombo, isInputElement } from "../utils/key-parser.js";
const VERSION = "1.0.0-AAA";
const MODULE_ID = "app-shell.ui.keyboard-shortcuts.core.trigger";
function trigger(combo, context) {
  const parsed = parseCombo(combo);
  if (!parsed) return { ok: false, error: "Invalid combo" };
  const id = comboToString(parsed);
  const shortcut = getShortcuts().get(id);
  if (!shortcut) return { ok: false, error: "Not found" };
  if (!shortcut.enabled) return { ok: false, error: "Disabled" };
  try {
    shortcut.handler(context || {});
    incrementMetric("triggered");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
function handleKeydown(event) {
  if (!isEnabled()) return;
  const eventCombo = eventToCombo(event);
  if (!eventCombo) return;
  const comboStr = comboToString(eventCombo);
  const config = getConfig();
  if (getLastCombo() === comboStr) return;
  setLastCombo(comboStr);
  setTimeout(() => {
    setLastCombo(null);
  }, config.debounceMs);
  const isInput = isInputElement(event.target);
  const activeScope = getActiveScope();
  const shortcuts = getShortcuts();
  let matched = null;
  shortcuts.forEach((shortcut) => {
    if (!shortcut.enabled) return;
    if (!matchesCombo(eventCombo, shortcut.parsed)) return;
    if (shortcut.scope !== SHORTCUT_SCOPES.GLOBAL && shortcut.scope !== activeScope) return;
    if (isInput && !shortcut.allowInInputs) return;
    matched = shortcut;
  });
  if (!matched) return;
  if (matched.preventDefault) event.preventDefault();
  if (matched.stopPropagation) event.stopPropagation();
  try {
    matched.handler({ event, combo: comboStr, shortcut: matched });
    incrementMetric("triggered");
    const subscribers = getSubscribers();
    for (let i = 0; i < subscribers.length; i++) {
      try {
        subscribers[i]({
          type: "triggered",
          shortcut: matched,
          timestamp: Date.now()
        });
      } catch (e) {
      }
    }
  } catch (e) {
    console.debug("%c[ERROR]%c [KeyboardShortcuts] Handler error:", "color:#ef4444;font-weight:bold", "color:inherit", e.message || e);
  }
}
function initKeyboardListener() {
  if (typeof document !== "undefined") {
    document.addEventListener("keydown", handleKeydown);
  }
}
function removeKeyboardListener() {
  if (typeof document !== "undefined") {
    document.removeEventListener("keydown", handleKeydown);
  }
}
var trigger_default = {
  trigger,
  handleKeydown,
  initKeyboardListener,
  removeKeyboardListener
};
export {
  MODULE_ID,
  VERSION,
  trigger_default as default,
  handleKeydown,
  initKeyboardListener,
  removeKeyboardListener,
  trigger
};
