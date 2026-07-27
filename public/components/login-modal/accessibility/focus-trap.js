import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.8.0-P17WI";
const MODULE_ID = "login-modal-accessibility-focus-trap";
const Ports = createUiPorts({ moduleId: MODULE_ID });
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
const _debugEnabled = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level, ...rest) {
  const logger = _getPort("logger");
  if (!logger) return;
  const args = rest;
  if (level === "error") {
    if (logger.error) logger.error(...["[login-focus-trap]"].concat(args));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(...["[login-focus-trap]"].concat(args));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(...["[login-focus-trap]"].concat(args));
};
const FOCUS_TRAP_STATES = { IDLE: "IDLE", ACTIVE: "ACTIVE", RESTORING_FOCUS: "RESTORING_FOCUS", DESTROYED: "DESTROYED" };
const isBrowser = typeof document !== "undefined" && typeof window !== "undefined";
function FocusTrap(container, config) {
  if (!config) config = {};
  const acc = config.accessibility || {};
  this.container = container;
  this.config = config;
  this.state = FOCUS_TRAP_STATES.IDLE;
  this.lastFocusedElement = null;
  this.circularRotation = acc.circularFocusTrap !== false;
  this.fallbackSelector = acc.focusFallbackSelector || null;
  this.telemetry = config.telemetry || null;
  this.handleShiftEscape = acc.focusTrapShiftEscape || false;
  this._handleKeyDown = this.handleKeyDown.bind(this);
  this._handleFocusIn = this.handleFocusIn.bind(this);
  this.abortController = null;
  this.mutationObserver = null;
  this.focusableCache = null;
  this._metrics = { activations: 0, deactivations: 0, circularForward: 0, circularBackward: 0, escapePrevented: 0, focusRestored: 0 };
  _initPorts();
}
FocusTrap.prototype.activate = function() {
  if (!isBrowser) {
    _log("info", "activate() ignorado SSR");
    return;
  }
  if (!this.container) {
    _log("info", "Container n\xE3o definido");
    return;
  }
  if (this.state === FOCUS_TRAP_STATES.ACTIVE) {
    _log("info", "J\xE1 ativo");
    return;
  }
  const focusableElements = this._getFocusableElements();
  if (focusableElements.length === 0) {
    _log("info", "Nenhum elemento foc\xE1vel");
    return;
  }
  this._metrics.activations++;
  this.lastFocusedElement = document.activeElement;
  this._setState(FOCUS_TRAP_STATES.ACTIVE);
  this.abortController = new AbortController();
  this.container.addEventListener("keydown", this._handleKeyDown, { capture: true, signal: this.abortController.signal });
  document.addEventListener("focusin", this._handleFocusIn, { signal: this.abortController.signal });
  this._setupMutationObserver();
  this.focusFirstElement();
  this._emitTelemetry("focus_trap_activated");
  _log("info", "Focus trap ativado");
};
FocusTrap.prototype.deactivate = function() {
  if (this.state !== FOCUS_TRAP_STATES.ACTIVE) return;
  this._metrics.deactivations++;
  this._setState(FOCUS_TRAP_STATES.RESTORING_FOCUS);
  if (this.abortController) {
    this.abortController.abort();
    this.abortController = null;
  }
  if (this.mutationObserver) {
    this.mutationObserver.disconnect();
    this.mutationObserver = null;
  }
  this._restoreFocus();
  this._setState(FOCUS_TRAP_STATES.IDLE);
  this._emitTelemetry("focus_trap_deactivated");
  _log("info", "Focus trap desativado");
};
FocusTrap.prototype.handleKeyDown = function(event) {
  if (this.handleShiftEscape && event.shiftKey && event.key === "Escape") {
    this._emitTelemetry("focus_trap_shift_escape");
    this._emitEvent("escape");
    return;
  }
  if (event.key !== "Tab") return;
  const focusableElements = this._getFocusableElements();
  if (focusableElements.length === 0) {
    event.preventDefault();
    return;
  }
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  if (this.circularRotation) {
    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        this._metrics.circularBackward++;
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
        this._metrics.circularForward++;
      }
    }
  } else {
    if (event.shiftKey && document.activeElement === firstElement) event.preventDefault();
    else if (!event.shiftKey && document.activeElement === lastElement) event.preventDefault();
  }
};
FocusTrap.prototype.handleFocusIn = function(event) {
  if (this.state !== FOCUS_TRAP_STATES.ACTIVE || !this.container) return;
  if (!this.container.contains(event.target)) {
    event.preventDefault();
    event.stopPropagation();
    this.focusFirstElement();
    this._metrics.escapePrevented++;
  }
};
FocusTrap.prototype.focusFirstElement = function() {
  if (!isBrowser) return;
  const self = this;
  self.focusableCache = null;
  const focusableElements = self._getFocusableElements();
  if (focusableElements.length > 0) {
    requestAnimationFrame(() => {
      const target = focusableElements[0];
      if (target && target.offsetParent !== null) target.focus({ preventScroll: true });
    });
  } else if (self.fallbackSelector) {
    self._focusFallback();
  }
};
FocusTrap.prototype.refresh = function() {
  this.focusableCache = null;
};
FocusTrap.prototype._restoreFocus = function() {
  if (!isBrowser) return;
  this._metrics.focusRestored++;
  if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === "function") {
    try {
      if (document.body.contains(this.lastFocusedElement)) this.lastFocusedElement.focus({ preventScroll: true });
      else this._focusFallback();
    } catch (error) {
      _log("error", "Erro ao restaurar foco", error);
      this._focusFallback();
    }
  } else {
    this._focusFallback();
  }
  this.lastFocusedElement = null;
};
FocusTrap.prototype._focusFallback = function() {
  if (!isBrowser) return;
  let target = null;
  if (this.fallbackSelector) target = document.querySelector(this.fallbackSelector);
  if (!target) target = document.querySelector('main[tabindex="-1"]');
  if (!target) {
    target = document.querySelector("h1, h2");
    if (target) target.setAttribute("tabindex", "-1");
  }
  if (!target) target = document.body;
  if (target) target.focus({ preventScroll: true });
};
FocusTrap.prototype._getFocusableElements = function() {
  if (!isBrowser || !this.container) return [];
  if (this.focusableCache) return this.focusableCache;
  const selector = ["a[href]:not([disabled]):not([data-ft-ignore])", "button:not([disabled]):not([data-ft-ignore])", "textarea:not([disabled]):not([data-ft-ignore])", 'input:not([type="hidden"]):not([disabled]):not([data-ft-ignore])', "select:not([disabled]):not([data-ft-ignore])", '[tabindex]:not([tabindex="-1"]):not([data-ft-ignore])'].join(",");
  const elements = Array.from(this.container.querySelectorAll(selector)).filter((el) => el.offsetParent !== null);
  this.focusableCache = elements;
  return elements;
};
FocusTrap.prototype._setupMutationObserver = function() {
  const self = this;
  if (!isBrowser || typeof MutationObserver === "undefined") return;
  self.mutationObserver = new MutationObserver(() => {
    self.focusableCache = null;
  });
  self.mutationObserver.observe(self.container, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "tabindex", "data-ft-ignore"] });
};
FocusTrap.prototype._emitEvent = function(event) {
  if (!isBrowser || typeof CustomEvent === "undefined") return;
  const customEvent = new CustomEvent(`focus-trap:${event}`, { bubbles: true, cancelable: true, detail: { state: this.state } });
  this.container.dispatchEvent(customEvent);
};
FocusTrap.prototype._setState = function(newState) {
  const oldState = this.state;
  this.state = newState;
  _log("info", `Estado: ${oldState} -> ${newState}`);
};
FocusTrap.prototype._emitTelemetry = function(event, data) {
  if (!data) data = {};
  if (!this.telemetry) return;
  try {
    this.telemetry.track(`focus-trap:${event}`, Object.assign({ event, state: this.state, timestamp: Date.now() }, data));
  } catch (e) {
  }
};
FocusTrap.prototype.getStatus = function() {
  return { state: this.state, isActive: this.state === FOCUS_TRAP_STATES.ACTIVE, hasFocusableElements: this._getFocusableElements().length > 0, lastFocusedElement: this.lastFocusedElement ? this.lastFocusedElement.tagName : null };
};
FocusTrap.prototype.unbind = function() {
  this.deactivate();
  this._setState(FOCUS_TRAP_STATES.DESTROYED);
  this.focusableCache = null;
};
FocusTrap.prototype.info = function() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), metrics: Object.assign({}, this._metrics), state: this.state, status: this.getStatus(), timestamp: Date.now() };
};
FocusTrap.prototype.healthCheck = function() {
  const logger = _getPort("logger");
  const checks = { isBrowserEnvironment: isBrowser, hasContainer: !!this.container, notDestroyed: this.state !== FOCUS_TRAP_STATES.DESTROYED, canFindFocusables: this._getFocusableElements().length >= 0, loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const status = passed === 6 ? "HEALTHY" : passed >= 4 ? "DEGRADED" : "UNHEALTHY";
  return { status, score: `${passed}/6`, healthy: passed >= 4, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
};
var focus_trap_default = FocusTrap;
export {
  FOCUS_TRAP_STATES,
  FocusTrap,
  MODULE_ID,
  VERSION,
  focus_trap_default as default,
  getPorts,
  injectPorts
};
