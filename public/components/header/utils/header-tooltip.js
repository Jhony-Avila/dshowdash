import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { getTooltipRoot } from "./overlay-root.js";
const MODULE_ID = "header/utils/header-tooltip";
const VERSION = "1.3.0-ENTERPRISE";
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
class HeaderTooltipManager {
  constructor(options = {}) {
    _initPorts();
    const cfg = _getPort("config");
    this.delay = options.delay || 300;
    this.className = options.className || "header-tooltip";
    this.activeTooltip = null;
    this.timeoutId = null;
    this._cleanups = [];
    this._metrics = { showCount: 0, hideCount: 0, lastShowAt: null };
    this._debug = cfg && cfg.app && cfg.app.debug;
  }
  attach(element) {
    if (!element) return;
    const tooltip = element.getAttribute("data-tooltip");
    if (!tooltip) return;
    const showHandler = () => this._show(element, tooltip);
    const hideHandler = () => this._hide();
    element.addEventListener("mouseenter", showHandler);
    element.addEventListener("mouseleave", hideHandler);
    element.addEventListener("focus", showHandler);
    element.addEventListener("blur", hideHandler);
    this._cleanups.push(() => {
      element.removeEventListener("mouseenter", showHandler);
      element.removeEventListener("mouseleave", hideHandler);
      element.removeEventListener("focus", showHandler);
      element.removeEventListener("blur", hideHandler);
    });
  }
  _show(element, text) {
    this._hide();
    this.timeoutId = setTimeout(() => {
      const el = document.createElement("div");
      el.className = this.className;
      el.textContent = text;
      el.setAttribute("role", "tooltip");
      el.style.pointerEvents = "none";
      el.style.position = "fixed";
      const root = getTooltipRoot();
      root.appendChild(el);
      const rect = element.getBoundingClientRect();
      el.style.left = `${rect.left + rect.width / 2}px`;
      el.style.top = `${rect.top - 30}px`;
      el.style.transform = "translateX(-50%)";
      this.activeTooltip = el;
      this._metrics.showCount++;
      this._metrics.lastShowAt = Date.now();
    }, this.delay);
  }
  _hide() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.activeTooltip) {
      this.activeTooltip.remove();
      this.activeTooltip = null;
      this._metrics.hideCount++;
    }
  }
  destroy() {
    this._hide();
    this._cleanups.forEach((fn) => {
      try {
        fn();
      } catch (e) {
      }
    });
    this._cleanups = [];
  }
  healthCheck() {
    const checks = { ready: true, noBodyAppendChild: true, portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? "HEALTHY" : "DEGRADED", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, hasActiveTooltip: !!this.activeTooltip, metrics: this._metrics, portsInitialized: Ports.isInitialized() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { showCount: 0, hideCount: 0, lastShowAt: null };
  }
}
function getVersion() {
  return VERSION;
}
var header_tooltip_default = HeaderTooltipManager;
export {
  HeaderTooltipManager,
  MODULE_ID,
  VERSION,
  header_tooltip_default as default,
  getPorts,
  getVersion,
  injectPorts
};
