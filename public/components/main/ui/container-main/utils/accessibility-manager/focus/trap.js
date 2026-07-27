import { incrementMetric } from "../state.js";
import { _emit } from "../helpers/logger.js";
import { announce } from "../api.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.accessibility-manager.focus.trap";
function setFocus(element, options = {}) {
  const el = typeof element === "string" ? document.querySelector(element) : element;
  if (!el) return false;
  const { preventScroll = false, announce: shouldAnnounce = false } = options;
  el.focus({ preventScroll });
  incrementMetric("focusChanges");
  if (shouldAnnounce) {
    const label = el.getAttribute("aria-label") || el.textContent?.trim() || el.tagName;
    announce(`Foco em: ${label}`);
  }
  _emit("focusChanged", { element: el });
  return true;
}
function trapFocus(container) {
  const el = typeof container === "string" ? document.querySelector(container) : container;
  if (!el) return () => {
  };
  const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])'
  ].join(", ");
  const focusableElements = el.querySelectorAll(focusableSelectors);
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];
  function handleKeyDown(e) {
    if (e.key !== "Tab") return;
    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  }
  el.addEventListener("keydown", handleKeyDown);
  firstFocusable?.focus();
  _emit("focusTrapped", { container: el });
  return function releaseTrap() {
    el.removeEventListener("keydown", handleKeyDown);
    _emit("focusReleased", { container: el });
  };
}
function releaseFocus() {
  _emit("focusReleased", {});
}
export {
  MODULE_ID,
  VERSION,
  releaseFocus,
  setFocus,
  trapFocus
};
