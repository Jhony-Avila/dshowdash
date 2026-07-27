import { getRegion } from "../../../core/dom-regions/index.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.keyboard-navigation.helpers.focus";
function getFocusableElements(container) {
  if (!container) return [];
  const selector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(", ");
  const elements = container.querySelectorAll(selector);
  const focusable = [];
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (el.offsetParent !== null || getComputedStyle(el).position === "fixed") {
      focusable.push(el);
    }
  }
  return focusable;
}
function focusFirstInRegion(regionName) {
  const region = getRegion(regionName);
  if (!region) return false;
  if (region.hasAttribute("tabindex")) {
    region.focus();
    return true;
  }
  const focusable = getFocusableElements(region);
  if (focusable.length > 0) {
    focusable[0].focus();
    return true;
  }
  region.setAttribute("tabindex", "-1");
  region.focus();
  return true;
}
export {
  MODULE_ID,
  VERSION,
  focusFirstInRegion,
  getFocusableElements
};
