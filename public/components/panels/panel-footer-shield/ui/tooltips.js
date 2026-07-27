const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-footer-shield/ui/tooltips";
let _tooltip = null;
let _container = null;
function _ensureContainer() {
  if (!_container) {
    _container = document.createElement("div");
    _container.className = "panel-tooltip-container";
    _container.setAttribute("data-tooltip-owner", MODULE_ID);
    _container.style.cssText = "position:fixed;top:0;left:0;width:0;height:0;z-index:10000;pointer-events:none;";
    const panel = document.querySelector('[data-panel="panel-footer-shield"]') || document.querySelector(".panel-footer-shield");
    (panel || document.documentElement).appendChild(_container);
  }
  return _container;
}
function _ensureTooltip() {
  if (!_tooltip) {
    _tooltip = document.createElement("div");
    _tooltip.className = "tooltip";
    _tooltip.style.cssText = "position:fixed;padding:0.5rem 0.75rem;background:#333;color:#fff;font-size:0.75rem;border-radius:0.25rem;pointer-events:none;opacity:0;transition:opacity 0.2s;white-space:nowrap;";
    _ensureContainer().appendChild(_tooltip);
  }
  return _tooltip;
}
function show(element, text, position = "top") {
  const tooltip = _ensureTooltip();
  tooltip.textContent = text;
  tooltip.style.opacity = "1";
  const rect = element.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  let top, left;
  switch (position) {
    case "bottom":
      top = rect.bottom + 8;
      left = rect.left + (rect.width - tooltipRect.width) / 2;
      break;
    case "left":
      top = rect.top + (rect.height - tooltipRect.height) / 2;
      left = rect.left - tooltipRect.width - 8;
      break;
    case "right":
      top = rect.top + (rect.height - tooltipRect.height) / 2;
      left = rect.right + 8;
      break;
    default:
      top = rect.top - tooltipRect.height - 8;
      left = rect.left + (rect.width - tooltipRect.width) / 2;
  }
  tooltip.style.top = `${Math.max(4, top)}px`;
  tooltip.style.left = `${Math.max(4, left)}px`;
}
function hide() {
  if (_tooltip) _tooltip.style.opacity = "0";
}
function attach(element, text, position) {
  element.addEventListener("mouseenter", () => show(element, text, position));
  element.addEventListener("mouseleave", hide);
  element.addEventListener("focus", () => show(element, text, position));
  element.addEventListener("blur", hide);
}
function destroy() {
  if (_container) {
    _container.remove();
    _container = null;
    _tooltip = null;
  }
}
function healthCheck() {
  return { status: "healthy", version: VERSION, moduleId: MODULE_ID, noBodyAppend: true };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() };
}
var tooltips_default = { show, hide, attach, destroy, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  attach,
  tooltips_default as default,
  destroy,
  healthCheck,
  hide,
  info,
  show
};
