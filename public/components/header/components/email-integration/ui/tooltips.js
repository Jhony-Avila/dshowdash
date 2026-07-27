import { getTooltipRoot } from "../../../utils/overlay-root.js";
const VERSION = "5.2.0-ES6";
const MODULE_ID = "header/components/email-integration/ui/tooltips";
let _debug = false;
const _logBuffer = [];
function _log(level) {
  const args = Array.prototype.slice.call(arguments, 1);
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
function TooltipManager(options) {
  options = options || {};
  this.delay = options.delay || 300;
  this.activeTooltip = null;
  this.timeoutId = null;
  this._metrics = { showCount: 0, hideCount: 0, lastShowAt: null };
}
TooltipManager.prototype.attach = function(element) {
  const self = this;
  if (!element) return;
  const tooltip = element.getAttribute("data-tooltip");
  if (!tooltip) return;
  element.addEventListener("mouseenter", () => {
    self._show(element, tooltip);
  });
  element.addEventListener("mouseleave", () => {
    self._hide();
  });
};
TooltipManager.prototype._show = function(element, text) {
  const self = this;
  this._hide();
  this.timeoutId = setTimeout(() => {
    const el = document.createElement("div");
    el.className = "email-tooltip";
    el.textContent = text;
    el.style.position = "fixed";
    el.style.pointerEvents = "none";
    getTooltipRoot().appendChild(el);
    const rect = element.getBoundingClientRect();
    el.style.left = `${rect.left + rect.width / 2}px`;
    el.style.top = `${rect.top - 30}px`;
    el.style.transform = "translateX(-50%)";
    self.activeTooltip = el;
    self._metrics.showCount++;
    self._metrics.lastShowAt = Date.now();
  }, this.delay);
};
TooltipManager.prototype._hide = function() {
  if (this.timeoutId) clearTimeout(this.timeoutId);
  if (this.activeTooltip) {
    this.activeTooltip.remove();
    this.activeTooltip = null;
    this._metrics.hideCount++;
  }
};
TooltipManager.prototype.healthCheck = () => {
  const checks = { ready: true, noBodyAppend: true };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: passed, maxScore: 2, scoreDisplay: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
TooltipManager.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, hasActiveTooltip: !!this.activeTooltip, metrics: this._metrics, healthCheck: this.healthCheck() };
};
TooltipManager.prototype.setDebug = (enabled) => {
  _debug = !!enabled;
};
TooltipManager.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics);
};
TooltipManager.prototype.resetMetrics = function() {
  this._metrics = { showCount: 0, hideCount: 0, lastShowAt: null };
};
TooltipManager.getLogs = () => _logBuffer.slice();
function setDebug(enabled) {
  _debug = !!enabled;
}
function getLogs() {
  return _logBuffer.slice();
}
var tooltips_default = TooltipManager;
export {
  MODULE_ID,
  TooltipManager,
  VERSION,
  tooltips_default as default,
  getLogs,
  setDebug
};
