import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-P17WI";
const MODULE_ID = "ticker.accessibility.focus-trap";
const hasWindow = typeof window !== "undefined";
const hasDocument = typeof document !== "undefined";
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
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args);
};
const FOCUSABLE_SELECTORS = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
class FocusTrap {
  constructor(options = {}) {
    this.returnFocusOnDeactivate = options.returnFocusOnDeactivate ?? true;
    this.escapeDeactivates = options.escapeDeactivates ?? true;
    this.onActivate = options.onActivate || null;
    this.onDeactivate = options.onDeactivate || null;
    this._container = null;
    this._active = false;
    this._previousFocus = null;
    this._firstFocusable = null;
    this._lastFocusable = null;
    this._metrics = { activations: 0, deactivations: 0, wraps: 0 };
    this._boundKeyHandler = this._onKeyDown.bind(this);
    this._boundFocusHandler = this._onFocus.bind(this);
  }
  init(container) {
    if (!container) return this;
    this._container = container;
    _log("debug", "FocusTrap initialized");
    return this;
  }
  activate() {
    if (this._active || !hasDocument) return;
    this._previousFocus = document.activeElement;
    this._updateFocusableElements();
    document.addEventListener("keydown", this._boundKeyHandler);
    document.addEventListener("focus", this._boundFocusHandler, true);
    this._active = true;
    this._metrics.activations++;
    if (this._firstFocusable) {
      this._firstFocusable.focus();
    } else {
      this._container.focus();
    }
    if (this.onActivate) this.onActivate();
    _log("debug", "Focus trap activated");
  }
  deactivate() {
    if (!this._active || !hasDocument) return;
    document.removeEventListener("keydown", this._boundKeyHandler);
    document.removeEventListener("focus", this._boundFocusHandler, true);
    this._active = false;
    this._metrics.deactivations++;
    if (this.returnFocusOnDeactivate && this._previousFocus) {
      this._previousFocus.focus();
    }
    this._previousFocus = null;
    if (this.onDeactivate) this.onDeactivate();
    _log("debug", "Focus trap deactivated");
  }
  // @ts-expect-error TS migration - TS2339
  _updateFocusableElements() {
    const focusables = Array.from(this._container.querySelectorAll(FOCUSABLE_SELECTORS)).filter((el) => el.offsetParent !== null);
    this._firstFocusable = focusables[0] || null;
    this._lastFocusable = focusables[focusables.length - 1] || null;
  }
  _onKeyDown(e) {
    if (e.key === "Tab") {
      this._updateFocusableElements();
      if (!this._firstFocusable || !this._lastFocusable) {
        e.preventDefault();
        return;
      }
      if (e.shiftKey) {
        if (document.activeElement === this._firstFocusable) {
          e.preventDefault();
          this._lastFocusable.focus();
          this._metrics.wraps++;
        }
      } else {
        if (document.activeElement === this._lastFocusable) {
          e.preventDefault();
          this._firstFocusable.focus();
          this._metrics.wraps++;
        }
      }
    } else if (e.key === "Escape" && this.escapeDeactivates) {
      this.deactivate();
    }
  }
  _onFocus(e) {
    if (!this._container.contains(e.target)) {
      e.stopPropagation();
      this._firstFocusable?.focus();
    }
  }
  isActive() {
    return this._active;
  }
  destroy() {
    this.deactivate();
    this._container = null;
    this._firstFocusable = null;
    this._lastFocusable = null;
  }
  healthCheck() {
    const logger = _getPort("logger");
    const checks = { hasContainer: !!this._container, hasFocusables: !!this._firstFocusable, loggerReady: !!logger, portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 4 ? "HEALTHY" : "DEGRADED", score: `${passed}/4`, active: this._active, checks, metrics: { ...this._metrics }, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, active: this._active, returnFocusOnDeactivate: this.returnFocusOnDeactivate, escapeDeactivates: this.escapeDeactivates, metrics: { ...this._metrics }, portsInitialized: Ports.isInitialized() };
  }
}
function getVersion() {
  return VERSION;
}
var focus_trap_default = FocusTrap;
export {
  FocusTrap,
  MODULE_ID,
  VERSION,
  focus_trap_default as default,
  getPorts,
  getVersion,
  injectPorts
};
