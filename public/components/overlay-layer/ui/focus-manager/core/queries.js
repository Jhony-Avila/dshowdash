import { FOCUSABLE_SELECTORS } from "../constants.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.ui.focus-manager.core.queries";
function getFocusableElements(container) {
  if (!container || typeof container.querySelectorAll !== "function") {
    return [];
  }
  const elements = Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS));
  return elements.filter((el) => {
    if (el.offsetParent === null && el.style.position !== "fixed") {
      return false;
    }
    if (el.getAttribute("aria-hidden") === "true") {
      return false;
    }
    let parent = el.parentElement;
    while (parent) {
      if (parent.getAttribute("aria-hidden") === "true") {
        return false;
      }
      parent = parent.parentElement;
    }
    return true;
  });
}
function getFirstFocusable(container) {
  const elements = getFocusableElements(container);
  return elements[0] || null;
}
function getLastFocusable(container) {
  const elements = getFocusableElements(container);
  return elements[elements.length - 1] || null;
}
var queries_default = {
  getFocusableElements,
  getFirstFocusable,
  getLastFocusable
};
export {
  MODULE_ID,
  VERSION,
  queries_default as default,
  getFirstFocusable,
  getFocusableElements,
  getLastFocusable
};
