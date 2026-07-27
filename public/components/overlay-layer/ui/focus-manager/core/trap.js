import {
  getConfig,
  isTrapped as _isTrapped,
  setTrapped,
  getTrapElement as _getTrapElement,
  setTrapElement,
  getTrapHandler,
  setTrapHandler,
  incrementTotalTraps
} from "../state.js";
import { getFocusableElements, getFirstFocusable } from "./queries.js";
import { focusElement } from "./actions.js";
import { saveFocus, restoreFocus } from "../persistence/save-restore.js";
const VERSION = "1.0.0";
const MODULE_ID = "overlay-layer.ui.focus-manager.core.trap";
function trap(container, options) {
  options = options || {};
  const config = getConfig();
  if (!config.enabled || !config.trapFocus) {
    return { ok: false, skipped: true, reason: "trap-disabled" };
  }
  if (!container || typeof container !== "object") {
    return { ok: false, error: "invalid-container" };
  }
  if (_isTrapped()) {
    release();
  }
  if (options.saveFocus !== false) {
    saveFocus();
  }
  const handleKeyDown = (event) => {
    if (event.key !== "Tab") return;
    const focusables = getFocusableElements(container);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (event.shiftKey) {
      if (active === first || !container.contains(active)) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (active === last || !container.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }
  };
  if (typeof document !== "undefined") {
    document.addEventListener("keydown", handleKeyDown, true);
  }
  setTrapped(true);
  setTrapElement(container);
  setTrapHandler(handleKeyDown);
  incrementTotalTraps();
  if (config.autoFocusFirst && options.autoFocus !== false) {
    const focusTarget = options.initialFocus ? container.querySelector(options.initialFocus) : getFirstFocusable(container);
    if (focusTarget) {
      setTimeout(() => {
        focusElement(focusTarget);
      }, config.focusDelay);
    }
  }
  return {
    ok: true,
    trapped: true,
    container: container.tagName,
    focusableCount: getFocusableElements(container).length
  };
}
function release(options) {
  options = options || {};
  if (!_isTrapped()) {
    return { ok: false, error: "not-trapped" };
  }
  const handler = getTrapHandler();
  if (typeof document !== "undefined" && handler) {
    document.removeEventListener("keydown", handler, true);
  }
  setTrapped(false);
  setTrapElement(null);
  setTrapHandler(null);
  if (options.restoreFocus !== false) {
    restoreFocus({ delay: options.restoreDelay });
  }
  return { ok: true, released: true };
}
function isTrapped() {
  return _isTrapped();
}
function getTrapElement() {
  return _getTrapElement();
}
var trap_default = {
  trap,
  release,
  isTrapped,
  getTrapElement
};
export {
  MODULE_ID,
  VERSION,
  trap_default as default,
  getTrapElement,
  isTrapped,
  release,
  trap
};
