// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-BUGFIX-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-tooltip
// PURPOSE: Container Tooltip Component
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   TOOLTIP_POSITION — exported value
//   init() — exported function
//   show() — exported function
//   hide() — exported function
//   destroy() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'focusin'
//   'focusout'
//   'mouseenter'
//   'mouseleave'
// WINDOW ACCESS:
//   window.innerHeight
//   window.innerWidth
//   window.scrollX
//   window.scrollY
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.1.0-BUGFIX';
export const MODULE_ID = 'container-tooltip';

let _tooltipEl: HTMLElement | null = null;
let _activeTarget: HTMLElement | null = null;
let _showTimeout: ReturnType<typeof setTimeout> | null = null;
let _hideTimeout: ReturnType<typeof setTimeout> | null = null;
let _initialized = false;

export const TOOLTIP_POSITION = { TOP: 'top', BOTTOM: 'bottom', LEFT: 'left', RIGHT: 'right', AUTO: 'auto' };

function _createTooltipElement() {
  const tooltip = document.createElement('div');
  tooltip.className = 'dsd-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.setAttribute('aria-hidden', 'true');
  tooltip.innerHTML = '<div class="dsd-tooltip__content"></div><div class="dsd-tooltip__arrow"></div>';
  document.body.appendChild(tooltip);
  return tooltip;
}

function _getOptimalPosition(targetRect: DOMRect, tooltipRect: DOMRect, preferredPosition: string) {
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

function _positionTooltip(target: HTMLElement, position: string) {
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

function _show(target: HTMLElement, content: string, position: string, delay: number) {
  if (!position) position = TOOLTIP_POSITION.AUTO;
  if (delay === undefined) delay = 200;
  
  if (_showTimeout) clearTimeout(_showTimeout);
  if (_hideTimeout) clearTimeout(_hideTimeout);
  
  _showTimeout = setTimeout(() => {
    if (!_tooltipEl) _tooltipEl = _createTooltipElement();
    
    const contentEl = _tooltipEl.querySelector('.dsd-tooltip__content');
    if (contentEl) contentEl.textContent = content;
    
    _tooltipEl.classList.add('dsd-tooltip--visible');
    _tooltipEl.setAttribute('aria-hidden', 'false');
    
    requestAnimationFrame(() => { _positionTooltip(target, position); });
    
    _activeTarget = target;
    target.setAttribute('aria-describedby', 'dsd-tooltip');
  }, delay);
}

function _hide(delay: number) {
  if (delay === undefined) delay = 100;
  
  if (_showTimeout) clearTimeout(_showTimeout);
  if (_hideTimeout) clearTimeout(_hideTimeout);
  
  _hideTimeout = setTimeout(() => {
    if (_tooltipEl) {
      _tooltipEl.classList.remove('dsd-tooltip--visible');
      _tooltipEl.setAttribute('aria-hidden', 'true');
    }
    if (_activeTarget) {
      _activeTarget.removeAttribute('aria-describedby');
      _activeTarget = null;
    }
  }, delay);
}

// BUGFIX: Check if e.target is an Element before calling closest()
function _getTooltipTarget(e: Event) {
  if (!e || !e.target) return null;
  // If target is not an Element (e.g., Text node), try parentElement
  let target: EventTarget | HTMLElement | null = e.target;
  if (typeof (target as HTMLElement).closest !== 'function') {
    target = (target as HTMLElement).parentElement;
  }
  if (!target || typeof (target as HTMLElement).closest !== 'function') return null;
  return (target as HTMLElement).closest('[data-tooltip]') as HTMLElement | null;
}

function _handleMouseEnter(e: Event) {
  const target = _getTooltipTarget(e);
  if (!target) return;
  
  const content = (target as HTMLElement).dataset.tooltip;
  const position = (target as HTMLElement).dataset.tooltipPosition || TOOLTIP_POSITION.AUTO;
  const delay = parseInt((target as HTMLElement).dataset.tooltipDelay || '', 10) || 200;
  
  if (content) _show(target, content, position, delay);
}

function _handleMouseLeave(e: Event) {
  const target = _getTooltipTarget(e);
  if (target) _hide(100);
}

function _handleFocusIn(e: Event) {
  const target = _getTooltipTarget(e);
  if (!target) return;
  
  const content = (target as HTMLElement).dataset.tooltip;
  const position = (target as HTMLElement).dataset.tooltipPosition || TOOLTIP_POSITION.AUTO;
  
  if (content) _show(target, content, position, 0);
}

function _handleFocusOut(e: Event) {
  const target = _getTooltipTarget(e);
  if (target) _hide(0);
}

export function init() {
  if (_initialized) return;
  
  document.addEventListener('mouseenter', _handleMouseEnter, true);
  document.addEventListener('mouseleave', _handleMouseLeave, true);
  document.addEventListener('focusin', _handleFocusIn, true);
  document.addEventListener('focusout', _handleFocusOut, true);
  
  _initialized = true;
}

export function show(target: HTMLElement, content: string, options: Record<string, unknown> = {}) {
  if (!options) options = {};
  const position = (options.position as string) || TOOLTIP_POSITION.AUTO;
  const delay = options.delay !== undefined ? (options.delay as number) : 0;
  _show(target, content, position, delay);
}

export function hide() {
  _hide(0);
}

export function destroy() {
  document.removeEventListener('mouseenter', _handleMouseEnter, true);
  document.removeEventListener('mouseleave', _handleMouseLeave, true);
  document.removeEventListener('focusin', _handleFocusIn, true);
  document.removeEventListener('focusout', _handleFocusOut, true);
  
  if (_showTimeout) clearTimeout(_showTimeout);
  if (_hideTimeout) clearTimeout(_hideTimeout);
  
  if (_tooltipEl) _tooltipEl.remove();
  _tooltipEl = null;
  _activeTarget = null;
  _initialized = false;
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: _initialized, hasActiveTooltip: !!_activeTarget };
}

export function healthCheck() {
  return { status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID, initialized: _initialized };
}

export default {
  init, show, hide, destroy,
  info, healthCheck, VERSION, MODULE_ID, TOOLTIP_POSITION
};
