const VERSION = "5.5.0-ENTERPRISE";
const MODULE_ID = "login-modal-utils-dom";
const _metrics = { focusQueries: 0, inertSets: 0, scrollLocks: 0, scrollUnlocks: 0, escapes: 0 };
function FocusUtils(config) {
  config = config || {};
  this.config = config;
  this.telemetry = config.telemetry || null;
  this.visibilityPolicy = config.visibilityPolicy || "offsetParent";
  this.selectorWhitelist = this._normalizeSelectors(config.selectorWhitelist);
  this.selectorBlacklist = this._normalizeSelectors(config.selectorBlacklist) || [];
}
FocusUtils.prototype._normalizeSelectors = (selectors) => {
  if (!selectors) return null;
  if (Array.isArray(selectors)) return selectors;
  if (typeof selectors === "string") return [selectors];
  return null;
};
FocusUtils.prototype.getFocusableElements = function(container) {
  const self = this;
  _metrics.focusQueries++;
  const baseSelectors = ["a[href]", "area[href]", "input:not([disabled])", "select:not([disabled])", "textarea:not([disabled])", "button:not([disabled])", '[tabindex]:not([tabindex="-1"]):not([disabled])', '[contenteditable="true"]'];
  const selectors = this.selectorWhitelist || baseSelectors;
  let elements = Array.from(container.querySelectorAll(selectors.join(",")));
  if (this.selectorBlacklist.length > 0) {
    const blacklistSelector = this.selectorBlacklist.join(",");
    elements = elements.filter((el) => !el.matches(blacklistSelector));
  }
  elements = elements.filter((el) => {
    if (el.hasAttribute("inert")) return false;
    if (el.tabIndex < 0) return false;
    return self._isVisible(el);
  });
  this._track("focus:elements-found", { count: elements.length });
  return elements;
};
FocusUtils.prototype._isVisible = function(element) {
  switch (this.visibilityPolicy) {
    case "offsetParent":
      return element.offsetParent !== null || element === document.activeElement;
    case "computedStyle":
      const style = window.getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
    case "all":
      return true;
    default:
      return element.offsetParent !== null;
  }
};
FocusUtils.prototype._track = function(event, detail) {
  detail = detail || {};
  if (this.telemetry && typeof this.telemetry === "function") {
    this.telemetry(event, Object.assign({ timestamp: Date.now(), source: "focus-utils" }, detail));
  }
};
function ScrollUtils(config) {
  config = config || {};
  this.config = config;
  this.target = config.target || document.documentElement;
  this.telemetry = config.telemetry || null;
  this.locked = false;
}
ScrollUtils.prototype.lock = function() {
  if (this.locked) return;
  _metrics.scrollLocks++;
  const prev = this.target.style.overflow || "";
  this.target.dataset.prevOverflow = prev;
  this.target.style.overflow = "hidden";
  this.locked = true;
  this._track("scroll:locked");
};
ScrollUtils.prototype.unlock = function() {
  if (!this.locked) return;
  _metrics.scrollUnlocks++;
  const prev = this.target.dataset.prevOverflow || "";
  this.target.style.overflow = prev;
  delete this.target.dataset.prevOverflow;
  this.locked = false;
  this._track("scroll:unlocked");
};
ScrollUtils.prototype.isLocked = function() {
  return this.locked;
};
ScrollUtils.prototype._track = function(event, detail) {
  detail = detail || {};
  if (this.telemetry && typeof this.telemetry === "function") {
    this.telemetry(event, Object.assign({ timestamp: Date.now(), source: "scroll-utils" }, detail));
  }
};
function A11yInertUtils(config) {
  config = config || {};
  this.config = config;
  this.telemetry = config.telemetry || null;
}
A11yInertUtils.prototype.setInert = function(element, inert) {
  inert = inert !== false;
  if (!element) return;
  _metrics.inertSets++;
  if ("inert" in HTMLElement.prototype) {
    element.inert = inert;
  } else {
    if (inert) {
      element.setAttribute("aria-hidden", "true");
      element.setAttribute("data-inert-polyfill", "true");
    } else {
      element.removeAttribute("aria-hidden");
      element.removeAttribute("data-inert-polyfill");
    }
  }
  this._track("inert:set", { inert, elementId: element.id });
};
A11yInertUtils.prototype._track = function(event, detail) {
  detail = detail || {};
  if (this.telemetry && typeof this.telemetry === "function") {
    this.telemetry(event, Object.assign({ timestamp: Date.now(), source: "inert-utils" }, detail));
  }
};
function SanitizeUtils(config) {
  config = config || {};
  this.config = config;
  this.preserveLineBreaks = config.preserveLineBreaks || false;
}
SanitizeUtils.prototype.escapeHtml = function(text) {
  if (!text) return "";
  _metrics.escapes++;
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  let escaped = String(text).replace(/[&<>"']/g, (m) => map[m]);
  if (this.preserveLineBreaks) {
    escaped = escaped.replace(/\n/g, "<br>");
  }
  return escaped;
};
SanitizeUtils.prototype.stripHtml = (text) => {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
};
let _focusUtilsInstance = null;
let _scrollUtilsInstance = null;
let _inertUtilsInstance = null;
let _sanitizeUtilsInstance = null;
const DOMHelpers = {
  getFocusableElements(container) {
    if (!_focusUtilsInstance) {
      _focusUtilsInstance = new FocusUtils();
    }
    return _focusUtilsInstance.getFocusableElements(container);
  },
  setInert(element, inert) {
    if (!_inertUtilsInstance) {
      _inertUtilsInstance = new A11yInertUtils();
    }
    return _inertUtilsInstance.setInert(element, inert !== false);
  },
  lockScroll() {
    if (!_scrollUtilsInstance) {
      _scrollUtilsInstance = new ScrollUtils();
    }
    return _scrollUtilsInstance.lock();
  },
  unlockScroll() {
    if (!_scrollUtilsInstance) {
      _scrollUtilsInstance = new ScrollUtils();
    }
    return _scrollUtilsInstance.unlock();
  },
  escapeHtml(text) {
    if (!_sanitizeUtilsInstance) {
      _sanitizeUtilsInstance = new SanitizeUtils();
    }
    return _sanitizeUtilsInstance.escapeHtml(text);
  }
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: Object.assign({}, _metrics), timestamp: Date.now() };
}
function healthCheck() {
  const checks = { focusUtilsAvailable: typeof FocusUtils === "function", scrollUtilsAvailable: typeof ScrollUtils === "function", sanitizeUtilsAvailable: typeof SanitizeUtils === "function", domHelpersExported: !!DOMHelpers };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, healthy: passed >= 3, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
var dom_default = DOMHelpers;
export {
  A11yInertUtils,
  DOMHelpers,
  FocusUtils,
  MODULE_ID,
  SanitizeUtils,
  ScrollUtils,
  VERSION,
  dom_default as default,
  healthCheck,
  info
};
