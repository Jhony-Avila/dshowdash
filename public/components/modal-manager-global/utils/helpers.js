import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.modal-manager-global.utils.helpers";
const VERSION = "2.3.0-P2-ENTERPRISE";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function generateId(prefix) {
  prefix = prefix || "modal";
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function createBackdrop(options) {
  options = options || {};
  if (typeof document === "undefined") return null;
  const backdrop = document.createElement("div");
  backdrop.className = `modal-backdrop${options.className ? ` ${options.className}` : ""}`;
  backdrop.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:${options.zIndex || 1e3}`;
  return backdrop;
}
function trapFocus(element) {
  if (!element || typeof document === "undefined") return () => {
  };
  const focusable = element.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const handler = (e) => {
    if (e.key === "Tab") {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };
  element.addEventListener("keydown", handler);
  if (first) first.focus();
  return () => {
    element.removeEventListener("keydown", handler);
  };
}
function lockScroll() {
  if (typeof document === "undefined") return () => {
  };
  const scrollY = window.scrollY;
  document.body.style.position = "fixed";
  document.body.style.top = `-${scrollY}px`;
  document.body.style.width = "100%";
  return () => {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    window.scrollTo(0, scrollY);
  };
}
function deepClone(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (Array.isArray(obj)) return obj.map((item) => deepClone(item));
  const source = obj;
  const cloned = {};
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      cloned[key] = deepClone(source[key]);
    }
  }
  return cloned;
}
function executeCallback(callback, data) {
  if (typeof callback === "function") {
    try {
      callback(data);
    } catch (e) {
      const logger = _getPort("logger");
      if (logger && logger.error) logger.error("[helpers] Callback error:", e);
    }
  }
}
function escapeHtml(str) {
  if (typeof str !== "string") return "";
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return str.replace(/[&<>"']/g, (m) => map[m]);
}
function getFirstFocusable(container) {
  if (!container) return null;
  const focusables = getAllFocusable(container);
  return focusables.length > 0 ? focusables[0] : null;
}
function getAllFocusable(container) {
  if (!container) return [];
  const selector = 'button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';
  const elements = container.querySelectorAll(selector);
  const result = [];
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (!el.disabled && el.offsetParent !== null) {
      result.push(el);
    }
  }
  return result;
}
function init(ctx) {
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  return { ok: true, version: VERSION };
}
function healthCheck() {
  const checks = { portsInitialized: Ports.isInitialized(), functionsAvailable: typeof generateId === "function" && typeof deepClone === "function" };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  return { status: passed === checkKeys.length ? "HEALTHY" : "DEGRADED", score: `${passed}/${checkKeys.length}`, moduleId: MODULE_ID, version: VERSION, checks, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
}
function getVersion() {
  return VERSION;
}
var helpers_default = { MODULE_ID, VERSION, init, generateId, createBackdrop, trapFocus, lockScroll, deepClone, executeCallback, escapeHtml, getFirstFocusable, getAllFocusable, healthCheck, info, getVersion, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  createBackdrop,
  deepClone,
  helpers_default as default,
  escapeHtml,
  executeCallback,
  generateId,
  getAllFocusable,
  getFirstFocusable,
  getPorts,
  getVersion,
  healthCheck,
  info,
  init,
  injectPorts,
  lockScroll,
  trapFocus
};
