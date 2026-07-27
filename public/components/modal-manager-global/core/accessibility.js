import { getFirstFocusable, getAllFocusable } from "../utils/helpers.js";
const MODULE_ID = "modal-manager-global.core.accessibility";
const VERSION = "1.2.0-P2-ENTERPRISE";
const a11yState = { activeFocusTrap: null, previousActiveElement: null, hiddenElements: [], tabListener: null };
let _overlayRoot = null;
function _ensureOverlayRoot() {
  if (!_overlayRoot) {
    _overlayRoot = document.getElementById("app-overlay-root");
    if (!_overlayRoot) {
      _overlayRoot = document.createElement("div");
      _overlayRoot.id = "app-overlay-root";
      _overlayRoot.setAttribute("data-overlay-root", "true");
      _overlayRoot.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;z-index:9000;pointer-events:none;";
      (document.getElementById("app-shell") || document.documentElement).appendChild(_overlayRoot);
    }
  }
  return _overlayRoot;
}
function applyAriaAttributes(element, modal) {
  if (!element) return;
  element.setAttribute("role", "dialog");
  element.setAttribute("aria-modal", "true");
  if (modal.aria?.label) element.setAttribute("aria-label", modal.aria.label);
  if (modal.aria?.labelledBy) element.setAttribute("aria-labelledby", modal.aria.labelledBy);
  if (modal.aria?.describedBy) element.setAttribute("aria-describedby", modal.aria.describedBy);
  element.setAttribute("tabindex", "-1");
}
function removeAriaAttributes(element) {
  if (!element) return;
  element.removeAttribute("role");
  element.removeAttribute("aria-modal");
  element.removeAttribute("aria-label");
  element.removeAttribute("aria-labelledby");
  element.removeAttribute("aria-describedby");
  element.removeAttribute("tabindex");
}
function hideBackgroundFromScreenReaders(modalElement) {
  if (typeof document === "undefined") return;
  const siblings = document.body.children;
  a11yState.hiddenElements = [];
  for (let i = 0; i < siblings.length; i++) {
    const el = siblings[i];
    if (el === modalElement || el.contains(modalElement)) continue;
    if (el.getAttribute("aria-hidden") === "true") continue;
    el.setAttribute("aria-hidden", "true");
    a11yState.hiddenElements.push(el);
  }
}
function restoreBackgroundForScreenReaders() {
  for (let i = 0; i < a11yState.hiddenElements.length; i++) {
    a11yState.hiddenElements[i].removeAttribute("aria-hidden");
  }
  a11yState.hiddenElements = [];
}
function handleTabKey(event, container) {
  if (event.key !== "Tab") return;
  const focusables = getAllFocusable(container);
  if (focusables.length === 0) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey) {
    if (document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }
  } else {
    if (document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
function activateFocusTrap(container) {
  if (!container) return;
  if (typeof document === "undefined") return;
  a11yState.previousActiveElement = document.activeElement;
  if (a11yState.tabListener) document.removeEventListener("keydown", a11yState.tabListener, true);
  a11yState.tabListener = (e) => handleTabKey(e, container);
  document.addEventListener("keydown", a11yState.tabListener, true);
  a11yState.activeFocusTrap = container;
  setTimeout(() => {
    const first = getFirstFocusable(container);
    if (first) first.focus();
    else container.focus();
  }, 50);
}
function deactivateFocusTrap() {
  if (typeof document === "undefined") return;
  if (a11yState.tabListener) {
    document.removeEventListener("keydown", a11yState.tabListener, true);
    a11yState.tabListener = null;
  }
  if (a11yState.previousActiveElement && a11yState.previousActiveElement.focus) {
    try {
      a11yState.previousActiveElement.focus();
    } catch (e) {
    }
  }
  a11yState.activeFocusTrap = null;
  a11yState.previousActiveElement = null;
}
function announce(message, priority) {
  if (priority === void 0) priority = "polite";
  if (typeof document === "undefined") return;
  let announcer = document.getElementById("modal-announcer");
  if (!announcer) {
    announcer = document.createElement("div");
    announcer.id = "modal-announcer";
    announcer.className = "sr-only";
    announcer.setAttribute("aria-live", priority);
    announcer.setAttribute("aria-atomic", "true");
    announcer.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;";
    _ensureOverlayRoot().appendChild(announcer);
  }
  announcer.setAttribute("aria-live", priority);
  announcer.textContent = "";
  setTimeout(() => {
    announcer.textContent = message;
  }, 100);
}
function getState() {
  return { hasFocusTrap: !!a11yState.activeFocusTrap, hiddenElementsCount: a11yState.hiddenElements.length, previousActiveElement: a11yState.previousActiveElement?.tagName || null, noBodyAppend: true };
}
function cleanup() {
  deactivateFocusTrap();
  restoreBackgroundForScreenReaders();
}
function getVersion() {
  return VERSION;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, state: getState(), timestamp: Date.now() };
}
function healthCheck() {
  const state = getState();
  const checks = { focusTrapAvailable: typeof activateFocusTrap === "function", announceAvailable: typeof announce === "function", noOrphanHiddenElements: !state.hasFocusTrap || state.hiddenElementsCount >= 0 };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  return { status: passed === checkKeys.length ? "HEALTHY" : "DEGRADED", score: `${passed}/${checkKeys.length}`, checks, state, moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
var accessibility_default = { applyAriaAttributes, removeAriaAttributes, hideBackgroundFromScreenReaders, restoreBackgroundForScreenReaders, activateFocusTrap, deactivateFocusTrap, announce, getState, cleanup, getVersion, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  activateFocusTrap,
  announce,
  applyAriaAttributes,
  cleanup,
  deactivateFocusTrap,
  accessibility_default as default,
  getState,
  getVersion,
  healthCheck,
  hideBackgroundFromScreenReaders,
  info,
  removeAriaAttributes,
  restoreBackgroundForScreenReaders
};
