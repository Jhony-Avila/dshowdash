import { localState } from "./state.js";
import { refresh } from "./data.js";
import { toggleAutoRefresh } from "./auto-refresh.js";
import { closeDetails } from "./modals.js";
import { deselectAll } from "./selection.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels-panel-session-admin-core-keyboard";
let _domCleanups = [];
let _keyboardHandler = null;
function _registerDomListener(el, event, handler) {
  if (!el) return;
  el.addEventListener(event, handler);
  _domCleanups.push({ el, event, handler });
}
function _cleanupDomListeners() {
  _domCleanups.forEach((item) => {
    try {
      item.el.removeEventListener(item.event, item.handler);
    } catch (e) {
    }
  });
  _domCleanups = [];
  _keyboardHandler = null;
}
function setupKeyboardShortcuts(handlers) {
  _cleanupDomListeners();
  _keyboardHandler = (e) => {
    const ke = e;
    const target = ke.target;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return;
    const key = ke.key.toLowerCase();
    if (key === "r") {
      ke.preventDefault();
      refresh();
    } else if (key === "a") {
      ke.preventDefault();
      toggleAutoRefresh(handlers.onStateChange);
    } else if (key === "f") {
      ke.preventDefault();
      if (typeof handlers.toggleFullscreen === "function") handlers.toggleFullscreen();
    } else if (key === "i") {
      ke.preventDefault();
      if (typeof handlers.toggleInlineFilters === "function") handlers.toggleInlineFilters();
    } else if (key === "c") {
      ke.preventDefault();
      _toggleColumnsMenu();
    } else if (key === "e") {
      ke.preventDefault();
      _toggleExportMenu();
    } else if (key === "/") {
      ke.preventDefault();
      const searchEl = localState.container ? localState.container.querySelector('[data-filter="search"]') : null;
      if (searchEl) searchEl.focus();
    } else if (key === "escape") {
      if (localState.detailsSession) closeDetails();
      else if (localState.isFullscreen && typeof handlers.toggleFullscreen === "function") handlers.toggleFullscreen();
      else deselectAll(handlers.onStateChange);
    }
  };
  _registerDomListener(document, "keydown", _keyboardHandler);
}
function removeKeyboardShortcuts() {
  _cleanupDomListeners();
}
function _toggleExportMenu() {
  const menu = localState.container ? localState.container.querySelector("[data-export-menu]") : null;
  if (menu) menu.classList.toggle("psa__export-menu--open");
}
function _toggleColumnsMenu() {
  const menu = localState.container ? localState.container.querySelector("[data-columns-menu]") : null;
  if (menu) menu.classList.toggle("psa__columns-menu--open");
}
function destroy() {
  _cleanupDomListeners();
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, listenersRegistered: _domCleanups.length, p25Compliant: true };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { keyboardReady: true, cleanupRegistryActive: true }, listenersRegistered: _domCleanups.length, p25Compliant: true };
}
var keyboard_default = { setupKeyboardShortcuts, removeKeyboardShortcuts, destroy, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  keyboard_default as default,
  destroy,
  healthCheck,
  info,
  removeKeyboardShortcuts,
  setupKeyboardShortcuts
};
