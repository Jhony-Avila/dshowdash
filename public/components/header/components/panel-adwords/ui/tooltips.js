import { VERSION } from "/core/version.js";
const MODULE_ID = "header/components/panel-adwords/ui/tooltips";
let _debug = false;
let _tooltip = null;
const _metrics = { shown: 0, hidden: 0, lastShownAt: null };
function show(element, text, options = {}) {
  hide();
  _tooltip = document.createElement("div");
  _tooltip.className = "tooltip-popup";
  _tooltip.textContent = text;
  _tooltip.setAttribute("role", "tooltip");
  const rect = element.getBoundingClientRect();
  _tooltip.style.cssText = `position:fixed;z-index:9999;padding:6px 10px;background:#333;color:#fff;border-radius:4px;font-size:12px;top:${rect.bottom + 8}px;left:${rect.left}px;`;
  document.body.appendChild(_tooltip);
  _metrics.shown++;
  _metrics.lastShownAt = Date.now();
}
function hide() {
  if (_tooltip) {
    _tooltip.remove();
    _tooltip = null;
    _metrics.hidden++;
  }
}
function attachTooltip(element, text) {
  if (!element) return;
  element.addEventListener("mouseenter", () => show(element, text));
  element.addEventListener("mouseleave", hide);
  element.addEventListener("focus", () => show(element, text));
  element.addEventListener("blur", hide);
}
function setDebug(enabled) {
  _debug = !!enabled;
}
function getMetrics() {
  return { ..._metrics, active: !!_tooltip };
}
function resetMetrics() {
  _metrics.shown = 0;
  _metrics.hidden = 0;
  _metrics.lastShownAt = null;
}
function healthCheck() {
  return { status: "HEALTHY", score: 1, maxScore: 1, checks: { ready: true }, version: VERSION, moduleId: MODULE_ID };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, hasActiveTooltip: !!_tooltip, metrics: getMetrics() };
}
var tooltips_default = { show, hide, attachTooltip };
export {
  MODULE_ID,
  VERSION,
  attachTooltip,
  tooltips_default as default,
  getMetrics,
  healthCheck,
  hide,
  info,
  resetMetrics,
  setDebug,
  show
};
