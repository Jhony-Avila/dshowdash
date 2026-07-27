const VERSION = "1.1.0-BUGFIX";
const MODULE_ID = "container-tooltip";
let _tooltipEl = null;
let _activeTarget = null;
let _showTimeout = null;
let _hideTimeout = null;
let _initialized = false;
const TOOLTIP_POSITION = { TOP: "top", BOTTOM: "bottom", LEFT: "left", RIGHT: "right", AUTO: "auto" };
function _createTooltipElement() {
  const tooltip = document.createElement("div");
  tooltip.className = "dsd-tooltip";
  tooltip.setAttribute("role", "tooltip");
  tooltip.setAttribute("aria-hidden", "true");
  tooltip.innerHTML = '<div class="dsd-tooltip__content"></div><div class="dsd-tooltip__arrow"></div>';
  document.body.appendChild(tooltip);
  return tooltip;
}
function _getOptimalPosition(targetRect, tooltipRect, preferredPosition) {
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const padding = 10;
  if (preferredPosition !== TOOLTIP_POSITION.AUTO) {
    return preferredPosition;
  }
  const space = {
    top: targetRect.top - padding,
    bottom: viewport.height - targetRect.bottom - padding,
    left: targetRect.left - padding,
    right: viewport.width - targetRect.right - padding
  };
  if (space.top >= tooltipRect.height) return TOOLTIP_POSITION.TOP;
  if (space.bottom >= tooltipRect.height) return TOOLTIP_POSITION.BOTTOM;
  if (space.right >= tooltipRect.width) return TOOLTIP_POSITION.RIGHT;
  if (space.left >= tooltipRect.width) return TOOLTIP_POSITION.LEFT;
  return TOOLTIP_POSITION.TOP;
}
function _positionTooltip(target, position) {
  if (!_tooltipEl || !target) return;
  const targetRect = target.getBoundingClientRect();
  const tooltipRect = _tooltipEl.getBoundingClientRect();
  const actualPosition = _getOptimalPosition(targetRect, tooltipRect, position);
  let top = 0;
  let left = 0;
  const offset = 8;
  switch (actualPosition) {
    case TOOLTIP_POSITION.TOP:
      top = targetRect.top - tooltipRect.height - offset;
      left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
      break;
    case TOOLTIP_POSITION.BOTTOM:
      top = targetRect.bottom + offset;
      left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
      break;
    case TOOLTIP_POSITION.LEFT:
      top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
      left = targetRect.left - tooltipRect.width - offset;
      break;
    case TOOLTIP_POSITION.RIGHT:
      top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
      left = targetRect.right + offset;
      break;
  }
  const paddingVal = 5;
  left = Math.max(paddingVal, Math.min(left, window.innerWidth - tooltipRect.width - paddingVal));
  top = Math.max(paddingVal, Math.min(top, window.innerHeight - tooltipRect.height - paddingVal));
  _tooltipEl.style.top = `${top + window.scrollY}px`;
  _tooltipEl.style.left = `${left + window.scrollX}px`;
  _tooltipEl.dataset.position = actualPosition;
}
function _show(target, content, position, delay) {
  if (!position) position = TOOLTIP_POSITION.AUTO;
  if (delay === void 0) delay = 200;
  if (_showTimeout) clearTimeout(_showTimeout);
  if (_hideTimeout) clearTimeout(_hideTimeout);
  _showTimeout = setTimeout(() => {
    if (!_tooltipEl) _tooltipEl = _createTooltipElement();
    const contentEl = _tooltipEl.querySelector(".dsd-tooltip__content");
    if (contentEl) contentEl.textContent = content;
    _tooltipEl.classList.add("dsd-tooltip--visible");
    _tooltipEl.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => {
      _positionTooltip(target, position);
    });
    _activeTarget = target;
    target.setAttribute("aria-describedby", "dsd-tooltip");
  }, delay);
}
function _hide(delay) {
  if (delay === void 0) delay = 100;
  if (_showTimeout) clearTimeout(_showTimeout);
  if (_hideTimeout) clearTimeout(_hideTimeout);
  _hideTimeout = setTimeout(() => {
    if (_tooltipEl) {
      _tooltipEl.classList.remove("dsd-tooltip--visible");
      _tooltipEl.setAttribute("aria-hidden", "true");
    }
    if (_activeTarget) {
      _activeTarget.removeAttribute("aria-describedby");
      _activeTarget = null;
    }
  }, delay);
}
function _getTooltipTarget(e) {
  if (!e || !e.target) return null;
  let target = e.target;
  if (typeof target.closest !== "function") {
    target = target.parentElement;
  }
  if (!target || typeof target.closest !== "function") return null;
  return target.closest("[data-tooltip]");
}
function _handleMouseEnter(e) {
  const target = _getTooltipTarget(e);
  if (!target) return;
  const content = target.dataset.tooltip;
  const position = target.dataset.tooltipPosition || TOOLTIP_POSITION.AUTO;
  const delay = parseInt(target.dataset.tooltipDelay || "", 10) || 200;
  if (content) _show(target, content, position, delay);
}
function _handleMouseLeave(e) {
  const target = _getTooltipTarget(e);
  if (target) _hide(100);
}
function _handleFocusIn(e) {
  const target = _getTooltipTarget(e);
  if (!target) return;
  const content = target.dataset.tooltip;
  const position = target.dataset.tooltipPosition || TOOLTIP_POSITION.AUTO;
  if (content) _show(target, content, position, 0);
}
function _handleFocusOut(e) {
  const target = _getTooltipTarget(e);
  if (target) _hide(0);
}
function init() {
  if (_initialized) return;
  document.addEventListener("mouseenter", _handleMouseEnter, true);
  document.addEventListener("mouseleave", _handleMouseLeave, true);
  document.addEventListener("focusin", _handleFocusIn, true);
  document.addEventListener("focusout", _handleFocusOut, true);
  _initialized = true;
}
function show(target, content, options = {}) {
  if (!options) options = {};
  const position = options.position || TOOLTIP_POSITION.AUTO;
  const delay = options.delay !== void 0 ? options.delay : 0;
  _show(target, content, position, delay);
}
function hide() {
  _hide(0);
}
function destroy() {
  document.removeEventListener("mouseenter", _handleMouseEnter, true);
  document.removeEventListener("mouseleave", _handleMouseLeave, true);
  document.removeEventListener("focusin", _handleFocusIn, true);
  document.removeEventListener("focusout", _handleFocusOut, true);
  if (_showTimeout) clearTimeout(_showTimeout);
  if (_hideTimeout) clearTimeout(_hideTimeout);
  if (_tooltipEl) _tooltipEl.remove();
  _tooltipEl = null;
  _activeTarget = null;
  _initialized = false;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _initialized, hasActiveTooltip: !!_activeTarget };
}
function healthCheck() {
  return { status: _initialized ? "HEALTHY" : "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID, initialized: _initialized };
}
var tooltip_default = {
  init,
  show,
  hide,
  destroy,
  info,
  healthCheck,
  VERSION,
  MODULE_ID,
  TOOLTIP_POSITION
};
export {
  MODULE_ID,
  TOOLTIP_POSITION,
  VERSION,
  tooltip_default as default,
  destroy,
  healthCheck,
  hide,
  info,
  init,
  show
};
