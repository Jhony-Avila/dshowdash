import { getConfig } from "../state.js";
import { getFocusableElements, getFirstFocusable, getLastFocusable } from "./queries.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.ui.focus-manager.core.actions";
function focusElement(element, options) {
  options = options || {};
  if (!element || typeof element.focus !== "function") {
    return { ok: false, error: "invalid-element" };
  }
  const config = getConfig();
  const delay = options.delay !== void 0 ? options.delay : config.focusDelay;
  const doFocus = () => {
    try {
      element.focus({ preventScroll: !config.scrollIntoView });
      if (config.scrollIntoView && options.scrollIntoView !== false) {
        if (element.scrollIntoView) {
          element.scrollIntoView({ block: "nearest", behavior: "smooth" });
        }
      }
      return { ok: true, element: element.tagName };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };
  if (delay > 0) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(doFocus());
      }, delay);
    });
  }
  return doFocus();
}
function focusFirst(container, options) {
  const element = getFirstFocusable(container);
  if (!element) {
    return { ok: false, error: "no-focusable-element" };
  }
  return focusElement(element, options);
}
function focusLast(container, options) {
  const element = getLastFocusable(container);
  if (!element) {
    return { ok: false, error: "no-focusable-element" };
  }
  return focusElement(element, options);
}
function focusNext(container) {
  const searchContainer = container || document.body;
  const focusables = getFocusableElements(searchContainer);
  const activeIndex = focusables.indexOf(document.activeElement);
  if (activeIndex === -1 || activeIndex === focusables.length - 1) {
    return focusElement(focusables[0]);
  }
  return focusElement(focusables[activeIndex + 1]);
}
function focusPrevious(container) {
  const searchContainer = container || document.body;
  const focusables = getFocusableElements(searchContainer);
  const activeIndex = focusables.indexOf(document.activeElement);
  if (activeIndex <= 0) {
    return focusElement(focusables[focusables.length - 1]);
  }
  return focusElement(focusables[activeIndex - 1]);
}
var actions_default = {
  focusElement,
  focusFirst,
  focusLast,
  focusNext,
  focusPrevious
};
export {
  MODULE_ID,
  VERSION,
  actions_default as default,
  focusElement,
  focusFirst,
  focusLast,
  focusNext,
  focusPrevious
};
