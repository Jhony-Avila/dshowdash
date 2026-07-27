import {
  getConfig,
  getSavedFocus as _getSavedFocus,
  setSavedFocus,
  addToFocusHistory,
  getFocusHistory as _getFocusHistory,
  clearFocusHistory,
  incrementTotalRestores
} from "../state.js";
const VERSION = "1.0.0";
const MODULE_ID = "overlay-layer.ui.focus-manager.persistence.save-restore";
function saveFocus() {
  if (typeof document === "undefined") {
    return { ok: false, error: "no-document" };
  }
  const activeElement = document.activeElement;
  if (activeElement && activeElement !== document.body) {
    setSavedFocus(activeElement);
    addToFocusHistory({
      element: activeElement,
      timestamp: Date.now()
    });
    return { ok: true, element: activeElement.tagName, id: activeElement.id };
  }
  return { ok: false, error: "no-active-element" };
}
function restoreFocus(options) {
  options = options || {};
  const config = getConfig();
  if (!config.restoreFocus && !options.force) {
    return { ok: false, skipped: true, reason: "restore-disabled" };
  }
  const target = options.element || _getSavedFocus();
  if (!target) {
    return { ok: false, error: "no-saved-focus" };
  }
  if (typeof document !== "undefined" && !document.contains(target)) {
    setSavedFocus(null);
    return { ok: false, error: "element-removed-from-dom" };
  }
  const delay = options.delay !== void 0 ? options.delay : config.focusDelay;
  const doRestore = () => {
    try {
      target.focus({ preventScroll: options.preventScroll });
      setSavedFocus(null);
      incrementTotalRestores();
      return { ok: true, element: target.tagName };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };
  if (delay > 0) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(doRestore());
      }, delay);
    });
  }
  return doRestore();
}
function getSavedFocus() {
  return _getSavedFocus();
}
function getFocusHistory() {
  const history = _getFocusHistory();
  return history.map((entry) => ({
    tagName: entry.element ? entry.element.tagName : null,
    id: entry.element ? entry.element.id : null,
    timestamp: entry.timestamp,
    inDOM: typeof document !== "undefined" && document.contains(entry.element)
  }));
}
function clearHistory() {
  clearFocusHistory();
  return { ok: true };
}
var save_restore_default = {
  saveFocus,
  restoreFocus,
  getSavedFocus,
  getFocusHistory,
  clearHistory
};
export {
  MODULE_ID,
  VERSION,
  clearHistory,
  save_restore_default as default,
  getFocusHistory,
  getSavedFocus,
  restoreFocus,
  saveFocus
};
