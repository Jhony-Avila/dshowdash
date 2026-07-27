import { savedFocus, metrics } from "./state.js";
import { focusElement } from "./core.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.focus-manager.persistence";
function saveFocus(key) {
  const current = document.activeElement;
  if (current && current !== document.body) {
    savedFocus.set(key, current);
    return { ok: true, element: current };
  }
  return { ok: false, error: "No active element" };
}
function restoreFocus(key, options) {
  const saved = savedFocus.get(key);
  if (!saved) {
    return { ok: false, error: `No saved focus for key: ${key}` };
  }
  if (!document.contains(saved)) {
    savedFocus.delete(key);
    return { ok: false, error: "Saved element no longer in DOM" };
  }
  metrics.restores++;
  return focusElement(saved, options);
}
function clearSavedFocus(key) {
  if (key) {
    return savedFocus.delete(key);
  }
  savedFocus.clear();
  return true;
}
function getSavedFocusKeys() {
  const keys = [];
  savedFocus.forEach((v, k) => {
    keys.push(k);
  });
  return keys;
}
export {
  MODULE_ID,
  VERSION,
  clearSavedFocus,
  getSavedFocusKeys,
  restoreFocus,
  saveFocus
};
