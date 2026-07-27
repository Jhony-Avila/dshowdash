import {
  focusHistory,
  currentFocus,
  incrementMetric,
  notifySubscribers
} from "./state.js";
import { FOCUS_STRATEGIES, FOCUSABLE_SELECTOR } from "./constants.js";
const VERSION = "1.0.0-AAA";
const MODULE_ID = "app-shell.ui.focus-manager.core";
function focusElement(element, options) {
  options = options || {};
  if (!element || typeof element.focus !== "function") {
    return false;
  }
  const delay = options.delay || 0;
  function doFocus() {
    try {
      element.focus({ preventScroll: options.preventScroll });
      if (options.scrollIntoView) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      focusHistory.push(currentFocus.element);
      if (focusHistory.length > 50) focusHistory.shift();
      currentFocus.element = element;
      incrementMetric("focusChanges");
      notifySubscribers("focus-change", { element });
      return true;
    } catch (e) {
      return false;
    }
  }
  if (delay > 0) {
    setTimeout(doFocus, delay);
    return true;
  }
  return doFocus();
}
function focusRegion(regionName, options) {
  options = options || {};
  const strategy = options.strategy || FOCUS_STRATEGIES.FIRST;
  const region = document.getElementById(regionName) || document.querySelector(`[data-region="${regionName}"]`);
  if (!region) return false;
  const focusables = getFocusableIn(region);
  if (focusables.length === 0) {
    region.setAttribute("tabindex", "-1");
    return focusElement(region, options);
  }
  switch (strategy) {
    case FOCUS_STRATEGIES.FIRST:
      return focusElement(focusables[0], options);
    case FOCUS_STRATEGIES.LAST:
      return focusElement(focusables[focusables.length - 1], options);
    case FOCUS_STRATEGIES.SPECIFIC:
      if (options.selector) {
        const target = region.querySelector(options.selector);
        if (target) return focusElement(target, options);
      }
      return focusElement(focusables[0], options);
    case FOCUS_STRATEGIES.RESTORE:
      if (currentFocus.saved && region.contains(currentFocus.saved)) {
        return focusElement(currentFocus.saved, options);
      }
      return focusElement(focusables[0], options);
    default:
      return focusElement(focusables[0], options);
  }
}
function focusNext(container) {
  container = container || document.body;
  const focusables = getFocusableIn(container);
  const current = document.activeElement;
  const index = focusables.indexOf(current);
  if (index === -1 || index === focusables.length - 1) {
    return focusElement(focusables[0]);
  }
  return focusElement(focusables[index + 1]);
}
function focusPrevious(container) {
  container = container || document.body;
  const focusables = getFocusableIn(container);
  const current = document.activeElement;
  const index = focusables.indexOf(current);
  if (index <= 0) {
    return focusElement(focusables[focusables.length - 1]);
  }
  return focusElement(focusables[index - 1]);
}
function getCurrentFocus() {
  return document.activeElement;
}
function isFocused(element) {
  return document.activeElement === element;
}
function getFocusableIn(container) {
  container = container || document.body;
  const elements = container.querySelectorAll(FOCUSABLE_SELECTOR);
  const result = [];
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (el.offsetParent !== null && !el.disabled && el.tabIndex >= 0) {
      result.push(el);
    }
  }
  return result;
}
export {
  MODULE_ID,
  VERSION,
  focusElement,
  focusNext,
  focusPrevious,
  focusRegion,
  getCurrentFocus,
  getFocusableIn,
  isFocused
};
